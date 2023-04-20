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
      handleContextMenuOpenedMessage(message).then(sendResponse);
      break;
    default:
      sendResponse();
  }
  return true;
}

function handleContextMenuOpenedMessage({
  payload: { x, y, ew, eh, vw, vh, imageUrl },
}: ContextMenuOpenedMessage): Promise<string | undefined> {
  let imageUrlPromise = Promise.resolve(imageUrl);
  const { detectRegion } = useBartenderOptionsStore.getState();
  if (detectRegion === "whole-page" || typeof imageUrl === "undefined") {
    imageUrlPromise = chrome.tabs.captureVisibleTab({
      format: "png",
    });
    ew = vw;
    eh = vh;
  }
  const xRatio = x / ew;
  const yRatio = y / eh;
  bartenderStore.setState({ xRatio, yRatio, imageUrlPromise });
  return imageUrlPromise;
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

  const { xRatio, yRatio, imageUrlPromise } = bartenderStore.getState();
  const imageUrl = await imageUrlPromise;
  if (typeof imageUrl === "undefined") {
    alterBadgeEffect("complete", 0);
    return;
  }

  console.log(imageUrl);

  const imageData = await imageUrlToImageData(imageUrl);
  let results = await barcodeDetector.detect(imageData);

  const {
    detectRegion,
    // tolerance,

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

  if (detectRegion === "under-cursor") {
    results = results.filter(
      ({ cornerPoints }) =>
        robustPointInPolygon(
          cornerPoints.map(({ x, y }) => [x, y] as const),
          [xRatio * imageData.width, yRatio * imageData.height]
        ) < 1
    );
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
