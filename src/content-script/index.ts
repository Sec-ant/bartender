import { isElementVisible, getUrlFromImageLikeElement } from "./utils.js";

async function handleContextMenuEvent({ clientX, clientY }: MouseEvent) {
  const elements = document.elementsFromPoint(clientX, clientY);
  const clientXRelative = clientX / window.innerWidth;
  const clientYRelative = clientY / window.innerHeight;
  const message: ContextMenuOpenedMessage = {
    type: "context-menu-opened",
    target: "service-worker",
    payload: {
      x: clientXRelative,
      y: clientYRelative,
      ex: clientXRelative,
      ey: clientYRelative,
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
    message.payload.ex = (clientX - left) / width;
    message.payload.ey = (clientY - top) / height;
    await chrome.runtime.sendMessage(message);
    return;
  }
  await chrome.runtime.sendMessage(message);
}

window.addEventListener("contextmenu", handleContextMenuEvent);
