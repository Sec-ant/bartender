import { Resvg } from "@resvg/resvg-wasm";
import { orient2dfast as orient } from "robust-predicates";
import type { ClipboardWriteMessage } from "../common/message.js";
import { bartenderStore } from "./store.js";
import { BartenderOptionsState } from "../common/store.js";
import { assertNever } from "assert-never";

/**
 * Checks if the given text is a URL.
 * @function
 * @param {string} text - The text to check.
 * @param {Object} [options] - The options for the check.
 * @param {string[]} [options.urlSchemeWhitelist] - The list of allowed URL schemes.
 * @param {string[]} [options.urlSchemeBlacklist] - The list of disallowed URL schemes.
 * @returns {boolean} - Returns true if the text is a URL, false otherwise.
 */
export function isUrl(
  text: string,
  {
    urlSchemeWhitelist = [],
    urlSchemeBlacklist = [],
  }: {
    urlSchemeWhitelist?: string[];
    urlSchemeBlacklist?: string[];
  } = {
    urlSchemeWhitelist: [],
    urlSchemeBlacklist: [],
  }
): boolean {
  try {
    const url = new URL(text);

    let whitelist = true;
    let schemes: string[] = [];

    if (urlSchemeWhitelist.length === 0) {
      whitelist = false;
      schemes = urlSchemeBlacklist;
    } else {
      schemes = urlSchemeWhitelist;
    }

    return (
      whitelist === schemes.includes(url.protocol.match(/.+(?=:$)/)?.[0] || "")
    );
  } catch {
    return false;
  }
}

/**
 * Converts an image URL to image data.
 * @async
 * @function
 * @param {string} imageUrl - The URL of the image to convert.
 * @param {number} [width] - The width of the resulting image data.
 * @param {number} [height] - The height of the resulting image data.
 * @returns {Promise<ImageData>} - Returns a promise that resolves to the image data.
 */
export async function imageUrlToImageData(
  imageUrl: string,
  width?: number,
  height?: number
): Promise<ImageData> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(`Failed to request the image: ${imageUrl}`);
  }
  let imageBlob = await resp.blob();
  if (imageBlob.type === "image/svg+xml") {
    const svgUint8Array = new Uint8Array(await imageBlob.arrayBuffer());
    await bartenderStore.getState().loadResvgTask;
    const resvgJS = new Resvg(svgUint8Array);
    const pngData = resvgJS.render();
    const pngBuffer = pngData.asPng();
    imageBlob = new Blob([pngBuffer], { type: "image/png" });
    pngData.free();
  }
  // consoleImage(imageBlob);
  const imageBitmap = await createImageBitmap(imageBlob);
  width ??= imageBitmap.width;
  height ??= imageBitmap.height;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  context.drawImage(imageBitmap, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return imageData;
}

/**
 * Logs an image to the console.
 * @async
 * @function
 * @param {Blob} blob - The image blob to log.
 * @param {Object} [options] - The options for the log.
 * @param {number} [options.size] - The size of the image in the console.
 * @param {string} [options.color] - The background color of the image in the console.
 * @returns {Promise<string>} - Returns a promise that resolves to the console log string.
 */
export async function consoleImage(
  blob: Blob,
  {
    size: s = 100,
    color: c = "transparent",
  }: { size?: number; color?: string } = {}
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

/**
 * Opens the URLs of the detected barcodes.
 * @async
 * @function
 * @param {DetectedBarcode[]} results - The detected barcodes.
 * @param {Object} options - The options for opening the URLs.
 * @param {string[]} options.urlSchemeWhitelist - The list of allowed URL schemes.
 * @param {string[]} options.urlSchemeBlacklist - The list of disallowed URL schemes.
 * @param {boolean} options.changeFocus - Whether to change focus to the opened URL.
 * @param {string} options.openTarget - The target for opening the URLs.
 * @param {string} options.openBehavior - The behavior for opening the URLs.
 * @param {number} options.maxUrlCount - The maximum number of URLs to open.
 */
export async function openUrl(
  results: DetectedBarcode[],
  {
    urlSchemeWhitelist,
    urlSchemeBlacklist,
    changeFocus,
    openTarget,
    openBehavior,
    maxUrlCount,
  }: Pick<
    BartenderOptionsState,
    | "urlSchemeWhitelist"
    | "urlSchemeBlacklist"
    | "changeFocus"
    | "openTarget"
    | "openBehavior"
    | "maxUrlCount"
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
      return assertNever(openBehavior);
  }

  // URL results
  const urlResults = rescheduledResults.filter(
    ({ rawValue }, index) =>
      isUrl(rawValue, {
        urlSchemeWhitelist,
        urlSchemeBlacklist,
      }) && index < maxUrlCount
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
      return assertNever(openTarget);
  }
}

/**
 * Copies the raw values of the detected barcodes to the clipboard.
 * @async
 * @function
 * @param {DetectedBarcode[]} results - The detected barcodes.
 * @param {Object} options - The options for copying to the clipboard.
 * @param {string} options.copyBehavior - The behavior for copying to the clipboard.
 * @param {number} options.copyInterval - The interval between copying to the clipboard.
 * @param {number} options.maxCopyCount - The maximum number of values to copy to the clipboard.
 */
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
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
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
      return assertNever(copyBehavior);
  }
  const message: ClipboardWriteMessage = {
    type: "clipboard-write",
    target: "offscreen",
    payload: {
      contents: rescheduledResults.map((r) => r.rawValue),
      copyInterval,
      maxCopyCount,
    },
  };
  await chrome.runtime.sendMessage(message);
}

/**
 * Determines if a point is inside a polygon.
 * Source: https://github.com/mikolalysenko/robust-point-in-polygon
 * https://github.com/mikolalysenko/robust-point-in-polygon/issues/2#issuecomment-1371537705
 * @function
 * @param {(readonly [number, number])[]} vs - The vertices of the polygon.
 * @param {readonly [number, number]} point - The point to check.
 * @returns {-1 | 0 | 1} - Returns -1 if the point is outside the polygon, 0 if it is on the edge of the polygon, and 1 if it is inside the polygon.
 */
export function robustPointInPolygon(
  vs: (readonly [number, number])[],
  [x, y]: readonly [number, number]
): -1 | 0 | 1 {
  const n = vs.length;
  let inside = 1;
  let lim = n;
  for (let i = 0, j = n - 1; i < lim; j = i++) {
    const [xi, yi] = vs[i];
    const [xj, yj] = vs[j];
    if (yj < yi) {
      if (yj < y && y < yi) {
        const s = orient(xi, yi, xj, yj, x, y);
        if (s === 0) return 0;
        inside ^= +(0 < s);
      } else if (y === yi) {
        if (x === xi) return 0;
        const c = vs[(i + 1) % n];
        const yk = c[1];
        if (yi < yk) {
          const s = orient(xi, yi, xj, yj, x, y);
          if (s === 0) return 0;
          inside ^= +(0 < s);
        }
      }
    } else if (yi < yj) {
      if (yi < y && y < yj) {
        const s = orient(xi, yi, xj, yj, x, y);
        if (s === 0) return 0;
        inside ^= +(s < 0);
      } else if (y === yi) {
        if (x === xi) return 0;
        const c = vs[(i + 1) % n];
        const yk = c[1];
        if (yk < yi) {
          const s = orient(xi, yi, xj, yj, x, y);
          if (s === 0) return 0;
          inside ^= +(s < 0);
        }
      }
    } else if (y === yi) {
      let x0 = Math.min(xi, xj);
      let x1 = Math.max(xi, xj);
      if (i === 0) {
        while (j > 0) {
          const k = (j + n - 1) % n;
          const p = vs[k];
          if (p[1] !== y) break;
          const px = p[0];
          x0 = Math.min(x0, px);
          x1 = Math.max(x1, px);
          j = k;
        }
        if (j === 0) {
          if (x0 <= x && x <= x1) return 0;
          return 1;
        }
        lim = j + 1;
      }
      const y0 = vs[(j + n - 1) % n][1];
      while (i + 1 < lim) {
        const p = vs[i + 1];
        if (p[1] !== y) break;
        const px = p[0];
        x0 = Math.min(x0, px);
        x1 = Math.max(x1, px);
        i += 1;
      }
      if (x0 <= x && x <= x1) return 0;
      const y1 = vs[(i + 1) % n][1];
      if (x < x0 && y0 < y !== y1 < y) inside ^= 1;
    }
  }
  return (2 * inside - 1) as -1 | 1;
}

/**
 * Sets the badge of the action.
 * @async
 * @function
 * @param {Object} options - The options for setting the badge.
 * @param {string} [options.backgroundColor] - The background color of the badge.
 * @param {string} options.text - The text of the badge.
 * @param {string} [options.textColor] - The text color of the badge.
 * @param {Promise<ReturnType<typeof setTimeout>>} [options.promise] - A promise that resolves to a timeout ID.
 * @param {Parameters<typeof setTimeout>} [options.timeoutArgs] - The arguments for the setTimeout call.
 */
export async function setBadge({
  backgroundColor,
  text,
  textColor = "#ffffff",
  promise = Promise.resolve(
    setTimeout(() => {
      /* void */
    }, 0)
  ),
  timeoutArgs = [
    () => {
      /* void */
    },
    0,
  ],
}: {
  backgroundColor?: string;
  text: string;
  textColor?: string;
  promise?: Promise<ReturnType<typeof setTimeout>>;
  timeoutArgs?: Parameters<typeof setTimeout>;
}) {
  const timeoutId = await promise;
  clearTimeout(timeoutId);
  return Promise.allSettled([
    ...(backgroundColor
      ? [
          chrome.action.setBadgeBackgroundColor({
            color: backgroundColor,
          }),
        ]
      : []),
    chrome.action.setBadgeText({
      text: text,
    }),
    chrome.action.setBadgeTextColor({
      color: textColor,
    }),
  ]).then(() => setTimeout(...timeoutArgs));
}

export type BadgeType = "busy" | "intermediate" | "complete" | "clear";

/**
 * Alters the badge effect.
 * @async
 * @function
 * @param {BadgeType} type - The type of badge effect to apply.
 * @param {number} [num] - The number to display on the badge.
 * @param {number} [wait] - The time to wait before clearing the badge.
 */
export const alterBadgeEffect = (() => {
  let alterBadgeEffectTask = Promise.resolve(
    setTimeout(() => {
      /* void */
    }, 0)
  );
  return async (type: BadgeType, num = 0, wait = 10000) => {
    switch (type) {
      case "busy":
        await (alterBadgeEffectTask = setBadge({
          backgroundColor: "#ffc107",
          text: "...",
          promise: alterBadgeEffectTask,
        }));
        break;
      case "intermediate":
        await (alterBadgeEffectTask = setBadge({
          backgroundColor: "#ffc107",
          text: num.toString(10),
          promise: alterBadgeEffectTask,
        }));
        break;
      case "complete":
        await (alterBadgeEffectTask = setBadge({
          backgroundColor: num > 0 ? "#4caf50" : "#f44336",
          text: num.toString(10),
          promise: alterBadgeEffectTask,
          timeoutArgs: [
            () => {
              alterBadgeEffect("clear");
            },
            wait,
          ],
        }));
        break;
      case "clear":
        await (alterBadgeEffectTask = setBadge({
          text: "",
          promise: alterBadgeEffectTask,
        }));
        break;
      default:
        return assertNever(type);
    }
  };
})();
