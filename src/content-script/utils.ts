/**
 * Checks if an element is visible.
 * @param {Element} element - The element to check.
 * @returns {boolean} - Whether the element is visible.
 */
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

/**
 * Gets the URL of an image-like element.
 * @param {Element} element - The element to get the URL from.
 * @returns {string | undefined} - The URL of the element, or undefined if it could not be determined.
 */
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

/**
 * Checks if an element is an HTMLImageElement.
 * @param {Element} element - The element to check.
 * @returns {element is HTMLImageElement} - Whether the element is an HTMLImageElement.
 */
export function isHTMLImageElement(
  element: Element
): element is HTMLImageElement {
  try {
    return element instanceof HTMLImageElement;
  } catch {
    return false;
  }
}

/**
 * Checks if an element is an SVGSVGElement.
 * @param {Element} element - The element to check.
 * @returns {element is SVGSVGElement} - Whether the element is an SVGSVGElement.
 */
export function isSVGSVGElement(element: Element): element is SVGSVGElement {
  try {
    return element instanceof SVGSVGElement;
  } catch {
    return false;
  }
}

/**
 * Checks if an element is an SVGImageElement.
 * @param {Element} element - The element to check.
 * @returns {element is SVGImageElement} - Whether the element is an SVGImageElement.
 */
export function isSVGImageElement(
  element: Element
): element is SVGImageElement {
  try {
    return element instanceof SVGImageElement;
  } catch {
    return false;
  }
}

/**
 * Checks if an element is an HTMLCanvasElement.
 * @param {Element} element - The element to check.
 * @returns {element is HTMLCanvasElement} - Whether the element is an HTMLCanvasElement.
 */
export function isHTMLCanvasElement(
  element: Element
): element is HTMLCanvasElement {
  try {
    return element instanceof HTMLCanvasElement;
  } catch {
    return false;
  }
}

/**
 * Checks if an element is an HTMLVideoElement.
 * @param {Element} element - The element to check.
 * @returns {element is HTMLVideoElement} - Whether the element is an HTMLVideoElement.
 */
export function isHTMLVideoElement(
  element: Element
): element is HTMLVideoElement {
  try {
    return element instanceof HTMLVideoElement;
  } catch {
    return false;
  }
}

/**
 * Converts an SVGElement to a data URI.
 * @param {SVGElement} svg - The SVGElement to convert.
 * @returns {string} - The data URI of the SVGElement.
 */
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

/**
 * Gets the absolute URL of a relative URL.
 * @returns {(url: string) => string} - A function that takes a relative URL and returns its absolute URL.
 */
export const getAbsoluteUrl = (() => {
  let a: HTMLAnchorElement | undefined;
  return (url: string) => {
    if (!a) a = document.createElement("a");
    a.href = url;
    return a.href;
  };
})();

/**
 * Gets the data URL of an image-like element.
 * @returns {(image: HTMLImageElement | SVGImageElement | HTMLVideoElement) => string} - A function that takes an image-like element and returns its data URL.
 */
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
