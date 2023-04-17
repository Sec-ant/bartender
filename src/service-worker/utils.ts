import { Resvg } from "@resvg/resvg-wasm";
import { bartenderStore } from "./store.js";
import { BartenderOptionsState } from "../common/store.js";

export function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

export async function imageUrlToImageData(imageUrl: string) {
  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(`Failed to request the image: ${imageUrl}`);
  }
  let imageBlob = await resp.blob();
  if (imageBlob.type === "image/svg+xml") {
    const svgUint8Array = new Uint8Array(await imageBlob.arrayBuffer());
    await bartenderStore.getState().resvgWasmPromise;
    const resvgJS = new Resvg(svgUint8Array);
    const pngData = resvgJS.render();
    const pngBuffer = pngData.asPng();
    imageBlob = new Blob([pngBuffer], { type: "image/png" });
    pngData.free();
  }
  // consoleImage(imageBlob);
  const imageBitmap = await createImageBitmap(imageBlob);
  const { width, height } = imageBitmap;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  context.drawImage(imageBitmap, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return imageData;
}

export async function consoleImage(
  blob: Blob,
  { size: s = 100, color: c = "transparent" } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.addEventListener(
      "load",
      () => {
        const o =
          "background: url('" +
          r.result +
          "') left top no-repeat; font-size: " +
          s +
          "px; background-size: contain; background-color:" +
          c;
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

export async function openUrl(
  results: DetectedBarcode[],
  {
    changeFocus,
    openTarget,
    openBehavior,
    maxUrlCount,
  }: Pick<
    BartenderOptionsState,
    "changeFocus" | "openTarget" | "openBehavior" | "maxUrlCount"
  >
) {
  if (results.length === 0) {
    return;
  }

  // Rescheduled results
  let rescheduledResults: typeof results;
  switch (openBehavior) {
    case "open-all":
      rescheduledResults = results.slice(0);
      break;
    case "open-all-reverse":
      rescheduledResults = results.slice(0).reverse();
      break;
    case "open-first":
      rescheduledResults = results.slice(0, 1);
      break;
    case "open-last":
      rescheduledResults = results.slice(-1);
      break;
    default:
      openBehavior satisfies never;
      return;
  }

  // URL results
  const urlResults = rescheduledResults.filter(
    ({ rawValue }, index) => isUrl(rawValue) && index < maxUrlCount
  );

  // open
  switch (openTarget) {
    case "one-tab-each":
      urlResults.forEach(({ rawValue }) =>
        chrome.tabs.create({ url: rawValue, active: changeFocus })
      );
      break;
    case "one-window-each":
      urlResults.forEach(({ rawValue }) =>
        chrome.windows.create({
          url: rawValue,
          focused: changeFocus,
        })
      );
      break;
    case "one-window-all":
      chrome.windows.create({
        url: urlResults.map(({ rawValue }) => rawValue),
        focused: changeFocus,
      });
      break;
    default:
      openTarget satisfies never;
      return;
  }
}

export async function copyToClipboard(
  results: DetectedBarcode[],
  {
    copyBehavior,
    copyInterval,
    maxCopyCount,
  }: Pick<
    BartenderOptionsState,
    "copyBehavior" | "copyInterval" | "maxCopyCount"
  >
) {
  if (results.length === 0) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: "/offscreen.html",
    reasons: ["CLIPBOARD"],
    justification: "write text to the clipboard",
  });
  let rescheduledResults: typeof results;
  switch (copyBehavior) {
    case "copy-all":
      rescheduledResults = results.slice(0);
      break;
    case "copy-all-reverse":
      rescheduledResults = results.slice(0).reverse();
      break;
    case "copy-first":
      rescheduledResults = results.slice(0, 1);
      break;
    case "copy-last":
      rescheduledResults = results.slice(-1);
      break;
    default:
      copyBehavior satisfies never;
      return;
  }
  const message: WriteClipboardMessage = {
    type: "clipboard",
    target: "offscreen",
    payload: {
      contents: rescheduledResults.map((r) => r.rawValue),
      copyInterval,
      maxCopyCount,
    },
  };
  await chrome.runtime.sendMessage(message);
}
