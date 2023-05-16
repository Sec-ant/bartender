import type { Message, ClipboardWriteMessage } from "../common/message.js";

const textareaElement = document.querySelector("#text") as HTMLTextAreaElement;

chrome.runtime.onMessage.addListener(handleMessage);

/**
 * Handles incoming messages from the Chrome runtime.
 * @param {Message} message - The incoming message.
 * @param {chrome.runtime.MessageSender} _ - The sender of the message.
 * @param {() => void} sendResponse - Function to call to send a response.
 * @returns {boolean | undefined} - Whether to keep the message channel open for sending a response asynchronously.
 */
function handleMessage(
  message: Message,
  _: chrome.runtime.MessageSender,
  sendResponse: () => void
): boolean | undefined {
  if (message.target !== "offscreen") {
    return;
  }
  switch (message.type) {
    case "clipboard-write":
      handleClipboardWriteMessage(message).then(sendResponse);
      break;
    default:
      sendResponse();
      break;
  }
  return true;
}

/**
 * Handles a ClipboardWriteMessage by writing its contents to the clipboard.
 * @param {ClipboardWriteMessage} param0 - The ClipboardWriteMessage to handle.
 * @returns {Promise<unknown>} - A Promise that resolves when the message has been handled.
 */
async function handleClipboardWriteMessage({
  payload: { contents, copyInterval, maxCopyCount },
}: ClipboardWriteMessage): Promise<unknown> {
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
