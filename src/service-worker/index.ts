import "@sec-ant/barcode-detector";

import {
  copyToClipboard,
  openUrl,
  imageUrlToImageData,
  robustPointInPolygon,
} from "./utils.js";
import { bartenderStore } from "./store.js";
import { useBartenderOptionsStore } from "../common/index.js";

const barcodeDetector = new BarcodeDetector();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bartender",
    title: "Bartender",
    contexts: ["all"],
  });
});
chrome.contextMenus.onClicked.addListener(handleContextMenuClicked);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.storage.onChanged.addListener((changes, namespace) => {
  useBartenderOptionsStore.persist.rehydrate();
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
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
  payload: { x, y, ex, ey, imageUrl },
}: ContextMenuOpenedMessage): Promise<string | undefined> {
  let imageUrlPromise = Promise.resolve(imageUrl);
  const { detectRegion } = useBartenderOptionsStore.getState();
  if (
    detectRegion === "whole-page" ||
    typeof imageUrl === "undefined" ||
    // blob url cannot be shared to service worker
    new URL(imageUrl).protocol === "blob:"
  ) {
    imageUrlPromise = chrome.tabs.captureVisibleTab(undefined, {
      format: "png",
    });
  } else {
    x = ex;
    y = ey;
  }
  bartenderStore.setState({ x, y, imageUrlPromise });
  return imageUrlPromise;
}

async function handleContextMenuClicked(
  _: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (typeof tab === "undefined" || typeof tab.id === "undefined") {
    return;
  }
  const { x, y, imageUrlPromise } = bartenderStore.getState();
  const imageUrl = await imageUrlPromise;
  if (typeof imageUrl === "undefined") {
    return;
  }
  const imageData = await imageUrlToImageData(imageUrl);
  let results = await barcodeDetector.detect(imageData);
  bartenderStore.setState({
    x: NaN,
    y: NaN,
    imageUrlPromise: Promise.resolve(undefined),
  });

  const {
    detectRegion,
    tolerance,

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
          [x * imageData.width, y * imageData.height]
        ) < 1
    );
  }

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
}
