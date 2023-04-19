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

export function getUrlFromImageLikeElement(
  element: Element
): string | undefined {
  if (isHTMLImageElement(element)) {
    const url = getAbsoluteUrl(element.src);
    const urlObject = new URL(url);
    if (urlObject.protocol !== "blob:") {
      return url;
    }
    return getDataUrlFromImageLikeElement(element);
  }

  if (isSVGImageElement(element)) {
    const url = getAbsoluteUrl(element.href.animVal);
    const urlObject = new URL(url);
    if (urlObject.protocol !== "blob:") {
      return url;
    }
    return getDataUrlFromImageLikeElement(element);
  }

  if (isSVGSVGElement(element)) {
    const url = getAbsoluteUrl(svgToTinyDataUri(element));
    return url;
  }

  if (isHTMLCanvasElement(element)) {
    const url = getAbsoluteUrl(element.toDataURL("png"));
    return url;
  }

  if (isHTMLVideoElement(element)) {
    const url = getAbsoluteUrl(element.src);
    const urlObject = new URL(url);
    if (urlObject.protocol !== "blob:") {
      return url;
    }
    return getDataUrlFromImageLikeElement(element);
  }

  const { backgroundImage } = window.getComputedStyle(element);
  const backgroundImageUrl = backgroundImage.match(
    /url\(["']?([^"']*)["']?\)/
  )?.[1];
  if (typeof backgroundImageUrl !== "undefined") {
    const url = getAbsoluteUrl(backgroundImageUrl);
    const urlObject = new URL(url);
    if (urlObject.protocol !== "blob:") {
      return url;
    }
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

export function isSVGSVGElement(element: Element): element is SVGSVGElement {
  try {
    return element instanceof SVGSVGElement;
  } catch {
    return false;
  }
}

export function isSVGImageElement(
  element: Element
): element is SVGImageElement {
  try {
    return element instanceof SVGImageElement;
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
  let svgString = svg.outerHTML;
  svgString.charCodeAt(0) === 0xfeff && (svgString = svgString.slice(1));
  svgString = svgString.trim().replace(reWhitespace, " ").replaceAll('"', "'");
  svgString = encodeURIComponent(svgString);
  svgString = svgString.replace(reUrlHexPairs, specialHexDecode);
  return "data:image/svg+xml," + svgString;
}

export const getAbsoluteUrl = (() => {
  let a: HTMLAnchorElement | undefined;
  return (url: string) => {
    if (!a) a = document.createElement("a");
    a.href = url;
    return a.href;
  };
})();

export const getDataUrlFromImageLikeElement = (() => {
  let canvas: HTMLCanvasElement | undefined;
  return (image: HTMLImageElement | SVGImageElement | HTMLVideoElement) => {
    if (!canvas) canvas = document.createElement("canvas");
    if (isSVGImageElement(image)) {
      image.width.animVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
      canvas.width = image.width.animVal.valueInSpecifiedUnits;
      image.height.animVal.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
      canvas.height = image.height.animVal.valueInSpecifiedUnits;
    } else {
      canvas.width = image.width;
      canvas.height = image.height;
    }
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL();
    return dataUrl;
  };
})();
