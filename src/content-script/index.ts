import { isElementVisible, getUrlFromImageLikeElement } from "./utils.js";
import type { ContextMenuOpenedMessage } from "../common/message.js";

async function handleContextMenuEvent({ clientX, clientY }: MouseEvent) {
  const elements = document.elementsFromPoint(clientX, clientY);
  const message: ContextMenuOpenedMessage = {
    type: "context-menu-opened",
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

window.addEventListener("contextmenu", handleContextMenuEvent);
