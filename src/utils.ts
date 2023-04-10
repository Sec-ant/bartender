import { Resvg } from "@resvg/resvg-wasm";

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

export function getUrlFromImageLikeElement(
  element: Element
): string | undefined {
  if (isHTMLImageElement(element)) {
    const url = getAbsoluteUrl(element.src);
    return url;
  }
  if (isSVGElement(element)) {
    const url = getAbsoluteUrl(svgToTinyDataUri(element));
    return url;
  }
  if (isHTMLCanvasElement(element)) {
    const url = getAbsoluteUrl(element.toDataURL("png"));
    return url;
  }
  if (isHTMLVideoElement(element)) {
    const url = getAbsoluteUrl(element.src);
    return url;
  }
  const { backgroundImage } = window.getComputedStyle(element);
  const backgroundImageUrl = backgroundImage.match(
    /url\(["']?([^"']*)["']?\)/
  )?.[1];
  if (typeof backgroundImageUrl !== "undefined") {
    const url = getAbsoluteUrl(backgroundImageUrl);
    return url;
  }
  return undefined;
}

export function isHTMLImageElement(
  element: Element
): element is HTMLImageElement {
  try {
    return element instanceof HTMLImageElement;
  } catch {
    return false;
  }
}

export function isSVGElement(element: Element): element is SVGElement {
  try {
    return element instanceof SVGElement;
  } catch {
    return false;
  }
}

export function isHTMLCanvasElement(
  element: Element
): element is HTMLCanvasElement {
  try {
    return element instanceof HTMLCanvasElement;
  } catch {
    return false;
  }
}

export function isHTMLVideoElement(
  element: Element
): element is HTMLVideoElement {
  try {
    return element instanceof HTMLVideoElement;
  } catch {
    return false;
  }
}

export function isElementVisible(element: Element): boolean {
  let isVisible = element.checkVisibility?.({
    checkOpacity: true,
    checkVisibilityCSS: true,
  });
  if (typeof isVisible === "undefined") {
    const style = window.getComputedStyle(element);
    isVisible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      style.contentVisibility !== "hidden" &&
      style.opacity !== "0";
  }
  return isVisible;
}

export function svgToTinyDataUri(svg: SVGElement): string {
  const reWhitespace = /\s+/g;
  const reUrlHexPairs = /%[\dA-F]{2}/g;
  const hexDecode: { [key: string]: string } = {
    "%20": " ",
    "%3D": "=",
    "%3A": ":",
    "%2F": "/",
  };
  const specialHexDecode = (match: string) =>
    hexDecode[match] ?? match.toLowerCase();
  let svgString = String(svg);
  svgString.charCodeAt(0) === 0xfeff && (svgString = svgString.slice(1));
  svgString = svgString.trim().replace(reWhitespace, " ").replaceAll('"', "'");
  svgString = encodeURIComponent(svgString);
  svgString = svgString.replace(reUrlHexPairs, specialHexDecode);
  return "data:image/svg+xml," + svg;
}

export const getAbsoluteUrl = (() => {
  let a: HTMLAnchorElement | undefined;
  return (url: string) => {
    if (!a) a = document.createElement("a");
    a.href = url;
    return a.href;
  };
})();
