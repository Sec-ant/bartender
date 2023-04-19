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
    for (let i = 0; i < Math.min(contents.length, maxCopyCount); ++i) {
      if (i !== 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, copyInterval));
      }
      textareaElement.value = contents[i];
      textareaElement.select();
      document.execCommand("copy");
    }
  } catch (e) {
    return e;
  }
  window.close();
}
