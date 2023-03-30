/// <reference types="chrome-types" />

import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";
const detector = new BarcodeDetectorPolyfill({
  formats: ["qr_code"],
});

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bartender",
    title: "Bartender",
    contexts: ["image"],
  });
});

async function handleBrowserContextMenuEvent(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (typeof tab === "undefined" || typeof tab.id === "undefined") {
    return;
  }
  const { srcUrl } = info;
  if (!srcUrl) {
    return;
  }
  const resp = await fetch(srcUrl);
  if (resp.ok) {
    const imageBlob = await resp.blob();
    const imageBitmap = await createImageBitmap(imageBlob);
    const { width, height } = imageBitmap;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext(
      "2d"
    ) as OffscreenCanvasRenderingContext2D;
    context.drawImage(imageBitmap, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const results = await detector.detect(imageData);
    for (const result of results) {
      if (isUrl(result.rawValue)) {
        chrome.tabs.create({ url: result.rawValue });
      }
      console.log(result);
    }
  }
}

chrome.contextMenus.onClicked.addListener(handleBrowserContextMenuEvent);
