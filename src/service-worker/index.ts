import "@sec-ant/barcode-detector";

import {
  copyToClipboard,
  openUrl,
  imageUrlToImageData,
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
  console.log(message, sender);
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
  payload: { x, y, imageUrl },
}: ContextMenuOpenedMessage): Promise<string | undefined> {
  let imageUrlPromise = Promise.resolve(imageUrl);
  if (
    typeof imageUrl === "undefined" ||
    // blob url cannot be shared to service worker
    new URL(imageUrl).protocol === "blob:"
  ) {
    imageUrlPromise = chrome.tabs.captureVisibleTab(undefined, {
      format: "png",
    });
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
  const { imageUrlPromise } = bartenderStore.getState();
  const imageUrl = await imageUrlPromise;
  if (typeof imageUrl === "undefined") {
    return;
  }
  const imageData = await imageUrlToImageData(imageUrl);
  const results = await barcodeDetector.detect(imageData);
  bartenderStore.setState({
    x: NaN,
    y: NaN,
    imageUrlPromise: Promise.resolve(undefined),
  });
  if (useBartenderOptionsStore.getState().openUrl) {
    openUrl(results, useBartenderOptionsStore.getState().maxUrlCount);
  }
  if (useBartenderOptionsStore.getState().copyToClipboard) {
    await copyToClipboard(results.map((r) => r.rawValue));
  }
}
