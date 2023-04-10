import { isElementVisible, getUrlFromImageLikeElement } from "./utils.js";

window.addEventListener(
  "contextmenu",
  async ({ clientX, clientY }: MouseEvent) => {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      if (!isElementVisible(element)) {
        continue;
      }
      const imageUrl = getUrlFromImageLikeElement(element);
      if (typeof imageUrl === "undefined") {
        continue;
      }
      await chrome.runtime.sendMessage({
        type: "context-menu",
        value: {
          x: clientX,
          y: clientY,
          imageUrl,
        },
      } as BrowserContextMenuMessage);
      return;
    }
    const message: BrowserContextMenuMessage = {
      type: "context-menu",
      value: {
        x: clientX,
        y: clientY,
        imageUrl: undefined,
      },
    };
    await chrome.runtime.sendMessage(message);
  }
);
