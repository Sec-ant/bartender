import type { Message, WriteClipboardMessage } from "../common/message.js";

const textareaElement = document.querySelector("#text") as HTMLTextAreaElement;

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(
  message: Message,
  _: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (message.target !== "offscreen") {
    return;
  }
  switch (message.type) {
    case "clipboard":
      handleWriteClipboardMessage(message).then(sendResponse);
      break;
    default:
      sendResponse();
      break;
  }
  return true;
}

async function handleWriteClipboardMessage({
  payload: { contents, copyInterval, maxCopyCount },
}: WriteClipboardMessage): Promise<unknown> {
  try {
    let copyCount = 0;
    for (const content of contents) {
      if (copyCount >= maxCopyCount) {
        window.close();
        return;
      }
      textareaElement.value = content;
      textareaElement.select();
      document.execCommand("copy");
      ++copyCount;
      await new Promise<void>((resolve) => setTimeout(resolve, copyInterval));
    }
  } catch (e) {
    return e;
  }
  window.close();
}
