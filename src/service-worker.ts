/// <reference types="chrome-types" />
import { createStore } from "zustand/vanilla";
import { initWasm as initResvgWasm } from "@resvg/resvg-wasm";
import "@sec-ant/barcode-detector";

import { isUrl, imageUrlToImageData } from "./utils.js";

interface BartenderState {
  x: number;
  y: number;
  imageUrlPromise: Promise<string | undefined>;
}

const bartenderStore = createStore<BartenderState>()(() => ({
  x: NaN,
  y: NaN,
  imageUrlPromise: Promise.resolve(undefined),
}));

const barcodeDetector = new BarcodeDetector();

chrome.runtime.onInstalled.addListener(async () => {
  await initResvgWasm(
    fetch(
      `https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@${__RESVG_WASM_VERSION__}/index_bg.wasm`
    )
  );
  chrome.contextMenus.create({
    id: "bartender",
    title: "Bartender",
    contexts: ["all"],
  });
});

async function handleBrowserContextMenuEvent(
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
  for (const result of results) {
    const { rawValue } = result;
    if (isUrl(rawValue)) {
      chrome.tabs.create({ url: rawValue, active: false });
    }
    console.log(result);
  }
}

chrome.contextMenus.onClicked.addListener(handleBrowserContextMenuEvent);

function handleBrowserMessage(
  message: BrowserMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (typeof sender.tab === "undefined") {
    return;
  }
  switch (message.type) {
    case "context-menu":
      handleBrowserContextMenuMessage(message);
  }
  sendResponse();
  return true;
}

function handleBrowserContextMenuMessage({
  value: { x, y, imageUrl },
}: BrowserContextMenuMessage): void {
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
}

chrome.runtime.onMessage.addListener(handleBrowserMessage);
