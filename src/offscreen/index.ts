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
  payload: { contents },
}: WriteClipboardMessage): Promise<void> {
  try {
    const firstContent = contents.shift();
    if (typeof firstContent === "undefined") {
      return;
    }
    textareaElement.value = firstContent;
    textareaElement.select();
    document.execCommand("copy");
    for (const content of contents) {
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      textareaElement.value = content;
      textareaElement.select();
      document.execCommand("copy");
    }
  } finally {
    window.close();
  }
}
