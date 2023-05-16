import "@sec-ant/barcode-detector";
import type { Message, DetectionPrepareMessage } from "../common/index.js";
import {
  copyToClipboard,
  openUrl,
  imageUrlToImageData,
  robustPointInPolygon,
  alterBadgeEffect,
} from "./utils.js";
import { bartenderStore } from "./store.js";
import { useBartenderOptionsStore } from "../common/index.js";

/**
 * Represents a barcode detector instance.
 * @type {BarcodeDetector}
 */
const barcodeDetector: BarcodeDetector = new BarcodeDetector();

/**
 * Listener for the "onInstalled" event of the Chrome runtime.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bartender",
    title: "Bartender",
    contexts: [
      "page",
      "frame",
      "selection",
      "link",
      "editable",
      "image",
      "video",
      "audio",
    ],
  });
});

/**
 * Listener for the "onClicked" event of the context menus.
 */
chrome.contextMenus.onClicked.addListener(handleContextMenuClicked);

/**
 * Listener for the "onMessage" event of the Chrome runtime.
 */
chrome.runtime.onMessage.addListener(handleMessage);

/**
 * Listener for the "onChanged" event of the Chrome storage.
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  useBartenderOptionsStore.persist.rehydrate();
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});

/**
 * Handles messages sent to the service worker.
 * @function
 * @param {Message} message - The message to handle.
 * @param {chrome.runtime.MessageSender} sender - The sender of the message.
 * @param {() => void} sendResponse - The function to call to send a response.
 * @returns {boolean | undefined} - Returns true if the message was handled, undefined otherwise.
 */
function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (message.target !== "service-worker") {
    return;
  }
  switch (message.type) {
    case "detection-prepare":
      {
        handleDetectionPrepare(message);
        sendResponse();
      }
      break;
    default:
      sendResponse();
  }
  return true;
}

/**
 * Handles the "detection-prepare" message.
 * @function
 * @param {DetectionPrepareMessage} message - The "detection-prepare" message.
 */
function handleDetectionPrepare({
  payload: { x, y, ew, eh, vw, vh, imageUrl },
}: DetectionPrepareMessage) {
  let getImageData = imageUrl
    ? async () => await imageUrlToImageData(imageUrl)
    : async () => undefined;

  const { detectRegion, fallbackToUnderCursor, tolerance } =
    useBartenderOptionsStore.getState();

  let finalizedDetectRegion = detectRegion;

  if (detectRegion === "whole-page") {
    getImageData = async () =>
      await imageUrlToImageData(
        await chrome.tabs.captureVisibleTab({
          format: "png",
        })
      );
    ew = vw;
    eh = vh;
  } else if (
    typeof imageUrl === "undefined" &&
    detectRegion === "dom-element" &&
    fallbackToUnderCursor
  ) {
    getImageData = async () =>
      await imageUrlToImageData(
        await chrome.tabs.captureVisibleTab({
          format: "png",
        }),
        vw,
        vh
      );
    ew = vw;
    eh = vh;
    finalizedDetectRegion = "under-cursor";
  }

  const xRatio = x / ew;
  const yRatio = y / eh;
  const toleranceRatio = tolerance / ew;

  bartenderStore.setState({
    xRatio,
    yRatio,
    toleranceRatio,
    finalizedDetectRegion,
    getImageData,
  });
}

/**
 * Detects barcodes in the given tab.
 * @async
 * @function
 * @param {chrome.tabs.Tab} [tab] - The tab to detect barcodes in.
 */
async function detectBarcode(tab?: chrome.tabs.Tab) {
  // Get the previous detectBarcodeTask from the bartender store
  const { detectBarcodeTask: previousDetectBarcodeTask } =
    bartenderStore.getState();
  // Wait for the previous detectBarcodeTask to complete
  await previousDetectBarcodeTask;

  // Set the badge effect to "busy"
  alterBadgeEffect("busy");

  // Check if the tab is undefined or if the tab ID is undefined
  if (typeof tab === "undefined" || typeof tab.id === "undefined") {
    // Set the badge effect to "complete" with 0 results
    alterBadgeEffect("complete", 0);
    return;
  }

  // Get the state from the bartender store
  const {
    xRatio,
    yRatio,
    toleranceRatio,
    getImageData,
    finalizedDetectRegion,
  } = bartenderStore.getState();

  // Get the image data
  const imageData = await getImageData();

  // Check if the image data is undefined
  if (typeof imageData === "undefined") {
    // Set the badge effect to "complete" with 0 results
    alterBadgeEffect("complete", 0);
    return;
  }

  // Detect barcodes in the image data
  let results = await barcodeDetector.detect(imageData);

  // Get options from the bartender options store
  const {
    openUrl: shouldOpenUrl,
    urlSchemeWhitelist,
    urlSchemeBlacklist,
    changeFocus,
    openTarget,
    openBehavior,
    maxUrlCount,

    copyToClipboard: shouldCopyToClipboard,
    copyBehavior,
    copyInterval,
    maxCopyCount,
  } = useBartenderOptionsStore.getState();

  // Check if finalizedDetectRegion is set to "under-cursor"
  if (finalizedDetectRegion === "under-cursor") {
    // Filter results to only include barcodes under the cursor
    results = results.filter(({ cornerPoints }) => {
      const cornerPointsCount = cornerPoints.length;
      const polygonPoints: [number, number][] = [];

      let centroidX = 0;
      let centroidY = 0;

      for (let i = 0; i < cornerPointsCount; ++i) {
        const cornerPointX = cornerPoints[i].x;
        const cornerPointY = cornerPoints[i].y;
        polygonPoints.push([cornerPointX, cornerPointY]);
        centroidX += cornerPointX;
        centroidY += cornerPointY;
      }

      centroidX /= cornerPointsCount;
      centroidY /= cornerPointsCount;

      const mouseX = xRatio * imageData.width;
      const mouseY = yRatio * imageData.height;
      const tolerance = toleranceRatio * imageData.width;

      const distanceX = mouseX - centroidX;
      const distanceY = mouseY - centroidY;

      const distance = Math.sqrt(
        Math.pow(distanceX, 2) + Math.pow(distanceY, 2)
      );
      const adjustedDistance = Math.max(distance - tolerance, 0);
      const distanceMultiplier = adjustedDistance / distance;

      const adjustedMouseX = centroidX + distanceX * distanceMultiplier;
      const adjustedMouseY = centroidY + distanceY * distanceMultiplier;

      return (
        robustPointInPolygon(polygonPoints, [adjustedMouseX, adjustedMouseY]) <
        1
      );
    });
  }

  // Get the number of results
  const numOfResults = results.length;

  // Set the badge effect to "intermediate" with numOfResults results
  alterBadgeEffect("intermediate", numOfResults);

  // Check if shouldOpenUrl is true
  if (shouldOpenUrl) {
    // Open URLs of detected barcodes
    openUrl(results, {
      urlSchemeWhitelist,
      urlSchemeBlacklist,
      changeFocus,
      openTarget,
      openBehavior,
      maxUrlCount,
    });
  }

  // Check if shouldCopyToClipboard is true
  if (shouldCopyToClipboard) {
    // Copy raw values of detected barcodes to clipboard
    await copyToClipboard(results, {
      copyBehavior,
      copyInterval,
      maxCopyCount,
    });
  }

  // Set the badge effect to "complete" with numOfResults results
  alterBadgeEffect("complete", numOfResults);
}

/**
 * Handles the context menu click event.
 * @function
 * @param {chrome.contextMenus.OnClickData} _ - The click data.
 * @param {chrome.tabs.Tab} [tab] - The tab where the context menu was clicked.
 */
function handleContextMenuClicked(
  _: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  bartenderStore.setState({ detectBarcodeTask: detectBarcode(tab) });
}
