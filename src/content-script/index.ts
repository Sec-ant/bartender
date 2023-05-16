import { isElementVisible, getUrlFromImageLikeElement } from "./utils.js";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import type { Message, DetectionPrepareMessage } from "../common/index.js";
import "./components/bartender-page-selector.js";
import type { SelectEvent } from "./components/bartender-page-selector.js";

/**
 * Sends information about an image at the specified coordinates to the Chrome runtime.
 * @param {number} clientX - The x-coordinate of the image.
 * @param {number} clientY - The y-coordinate of the image.
 */
async function sendImageInfo(clientX: number, clientY: number) {
  const elements = document.elementsFromPoint(clientX, clientY);
  const message: DetectionPrepareMessage = {
    type: "detection-prepare",
    target: "service-worker",
    payload: {
      x: clientX,
      y: clientY,
      ew: window.innerWidth,
      eh: window.innerHeight,
      vw: window.innerWidth,
      vh: window.innerHeight,
      imageUrl: undefined,
    },
  };
  for (const element of elements) {
    if (!isElementVisible(element)) {
      continue;
    }
    const imageUrl = getUrlFromImageLikeElement(element);
    if (typeof imageUrl === "undefined") {
      continue;
    }
    message.payload.imageUrl = imageUrl;
    const { left, top, width, height } = element.getBoundingClientRect();
    message.payload.x -= left;
    message.payload.y -= top;
    message.payload.ew = width;
    message.payload.eh = height;
    await chrome.runtime.sendMessage(message);
    return;
  }
  await chrome.runtime.sendMessage(message);
}

/**
 * Handles a contextmenu event by sending information about an image at the event's coordinates to the Chrome runtime.
 * @returns {(event: MouseEvent) => Promise<void>} - A function that takes a MouseEvent and returns a Promise that resolves when the event has been handled.
 */
const handleContextMenuEvent = (() => {
  let sendImageInfoTask = Promise.resolve();
  return async ({ clientX, clientY }: MouseEvent) => {
    await sendImageInfoTask;
    sendImageInfoTask = sendImageInfo(clientX, clientY);
  };
})();

window.addEventListener("contextmenu", handleContextMenuEvent);

/**
 * Listener for the "onMessage" event of the Chrome runtime.
 */
chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(
  message: Message,
  _: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (message.target !== "content-script") {
    return;
  }
  switch (message.type) {
    case "page-select":
      {
        handlePageSelectMessage();
        sendResponse();
      }
      break;
    default:
      sendResponse();
  }
  return true;
}

function handlePageSelectMessage() {
  pageSelectStore.setState((state) => ({
    pageSelectActive: !state.pageSelectActive,
  }));
}

const pageSelectorElement = document.createElement("bartender-page-selector");

interface PageSelectState {
  pageSelectActive: boolean;
}

const pageSelectStore = createStore<PageSelectState>()(
  subscribeWithSelector<PageSelectState>(() => ({
    pageSelectActive: false,
  }))
);

pageSelectStore.subscribe(
  (state) => state.pageSelectActive,
  (active) => {
    if (active) {
      activate();
    } else {
      cleanUp();
    }
    return cleanUp;
  }
);

function handleSelected({ detail: { position } }: SelectEvent) {
  console.log(position);
}

function activate() {
  pageSelectorElement.addEventListener("selected", handleSelected);
  document.body.append(pageSelectorElement);
}

function cleanUp() {
  pageSelectorElement.remove();
  pageSelectorElement.removeEventListener("selected", handleSelected);
}
