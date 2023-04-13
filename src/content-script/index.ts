import { isElementVisible, getUrlFromImageLikeElement } from "./utils.js";

async function handleContextMenuEvent({ clientX, clientY }: MouseEvent) {
  const elements = document.elementsFromPoint(clientX, clientY);
  const message: ContextMenuOpenedMessage = {
    type: "context-menu-opened",
    target: "service-worker",
    payload: {
      x: clientX,
      y: clientY,
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
    await chrome.runtime.sendMessage(message);
    return;
  }
  await chrome.runtime.sendMessage(message);
}

window.addEventListener("contextmenu", handleContextMenuEvent);
