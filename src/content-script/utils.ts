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
