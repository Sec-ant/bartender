import "@sec-ant/barcode-detector";
import type { Message, ContextMenuOpenedMessage } from "../common/index.js";
import {
  copyToClipboard,
  openUrl,
  imageUrlToImageData,
  robustPointInPolygon,
  alterBadgeEffect,
} from "./utils.js";
import { bartenderStore } from "./store.js";
import { useBartenderOptionsStore } from "../common/index.js";

const barcodeDetector = new BarcodeDetector();

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
chrome.contextMenus.onClicked.addListener(handleContextMenuClicked);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.storage.onChanged.addListener((/* changes, namespace */) => {
  useBartenderOptionsStore.persist.rehydrate();
  /*
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
  */
});

function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (
    typeof sender.tab === "undefined" ||
    message.target !== "service-worker"
  ) {
    return;
  }
  switch (message.type) {
    case "context-menu-opened":
      {
        handleContextMenuOpenedMessage(message);
        sendResponse();
      }
      break;
    default:
      sendResponse();
  }
  return true;
}

function handleContextMenuOpenedMessage({
  payload: { x, y, ew, eh, vw, vh, imageUrl },
}: ContextMenuOpenedMessage) {
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

async function detectBarcode(tab?: chrome.tabs.Tab) {
  const { detectBarcodeTask: previousDetectBarcodeTask } =
    bartenderStore.getState();
  await previousDetectBarcodeTask;

  alterBadgeEffect("busy");

  if (typeof tab === "undefined" || typeof tab.id === "undefined") {
    alterBadgeEffect("complete", 0);
    return;
  }

  const {
    xRatio,
    yRatio,
    toleranceRatio,
    getImageData,
    finalizedDetectRegion,
  } = bartenderStore.getState();

  const imageData = await getImageData();

  if (typeof imageData === "undefined") {
    alterBadgeEffect("complete", 0);
    return;
  }

  let results = await barcodeDetector.detect(imageData);

  const {
    openUrl: shouldOpenUrl,
    changeFocus,
    openTarget,
    openBehavior,
    maxUrlCount,

    copyToClipboard: shouldCopyToClipboard,
    copyBehavior,
    copyInterval,
    maxCopyCount,
  } = useBartenderOptionsStore.getState();

  if (finalizedDetectRegion === "under-cursor") {
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

  const numOfResults = results.length;

  alterBadgeEffect("intermediate", numOfResults);

  if (shouldOpenUrl) {
    openUrl(results, {
      changeFocus,
      openTarget,
      openBehavior,
      maxUrlCount,
    });
  }

  if (shouldCopyToClipboard) {
    await copyToClipboard(results, {
      copyBehavior,
      copyInterval,
      maxCopyCount,
    });
  }

  alterBadgeEffect("complete", numOfResults);
}

function handleContextMenuClicked(
  _: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  bartenderStore.setState({ detectBarcodeTask: detectBarcode(tab) });
}
