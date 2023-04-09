/// <reference types="chrome-types" />
import { createStore } from "zustand/vanilla";
import { getZXingModule } from "@sec-ant/barcode-detector";
getZXingModule();

interface BartenderState {
  imageUrl: string | undefined;
}

const bartenderStore = createStore<BartenderState>()(() => ({
  imageUrl: undefined,
}));

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

const barcodeDetector = new BarcodeDetector();

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bartender",
    title: "Bartender",
    contexts: ["all"],
  });
});

async function consoleImage(
  blob: Blob,
  { size: s = 100, color: c = "transparent" } = {}
) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.addEventListener(
      "load",
      () => {
        /* Format the CSS string for console.log */
        const o =
          "background: url('" +
          r.result +
          "') left top no-repeat; font-size: " +
          s +
          "px; background-size: contain; background-color:" +
          c;
        /* Output to the console. */
        console.log("%c     ", o);
        resolve(o);
      },
      false
    );
    r.addEventListener(
      "error",
      (ev) => {
        reject(ev);
      },
      false
    );
    r.addEventListener(
      "abort",
      (ev) => {
        reject(ev);
      },
      false
    );
    r.readAsDataURL(blob);
  });
}

async function srcUrlToImageData(srcUrl: string) {
  const resp = await fetch(srcUrl);
  if (!resp.ok) {
    throw new Error(`Failed to request the image: ${srcUrl}`);
  }
  const imageBlob = await resp.blob();
  consoleImage(imageBlob);
  const imageBitmap = await createImageBitmap(imageBlob);
  const { width, height } = imageBitmap;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  context.drawImage(imageBitmap, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return imageData;
}

async function handleBrowserContextMenuEvent(
  _: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) {
  if (typeof tab === "undefined" || typeof tab.id === "undefined") {
    return;
  }
  const { imageUrl } = bartenderStore.getState();
  if (typeof imageUrl === "undefined") {
    return;
  }
  const imageData = await srcUrlToImageData(imageUrl);
  const results = await barcodeDetector.detect(imageData);
  bartenderStore.setState({
    imageUrl: undefined,
  });
  for (const result of results) {
    const { rawValue } = result;
    if (isUrl(rawValue)) {
      chrome.tabs.create({ url: rawValue });
    }
    console.log(result);
  }
}

chrome.contextMenus.onClicked.addListener(handleBrowserContextMenuEvent);

chrome.runtime.onMessage.addListener(
  (request: ChromeUrlMessage, sender, sendResponse) => {
    if (sender.tab && request.type === "url") {
      if (typeof request.value.url === "undefined") {
        chrome.tabs
          .captureVisibleTab(undefined, { format: "png" })
          .then((imageUrl) => {
            bartenderStore.setState({
              imageUrl,
            });
          });
      } else {
        bartenderStore.setState({
          imageUrl: request.value.url,
        });
      }
      sendResponse();
    }
    return true;
  }
);
