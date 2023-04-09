window.addEventListener("contextmenu", async (event: MouseEvent) => {
  const elements = document.elementsFromPoint(event.clientX, event.clientY);
  for (const element of elements) {
    if (!isElementVisible(element)) {
      continue;
    }
    const imageUrl = getImageUrlFromImageLikeElement(element);
    if (typeof imageUrl === "undefined") {
      continue;
    }
    await chrome.runtime.sendMessage({
      type: "url",
      value: {
        url: imageUrl,
      },
    } as ChromeUrlMessage);
    return;
  }
  await chrome.runtime.sendMessage({
    type: "url",
    value: {
      url: undefined,
    },
  } as ChromeUrlMessage);
});

function getImageUrlFromImageLikeElement(element: Element): string | undefined {
  if (isHTMLImageElement(element)) {
    return getAbsoluteUrl(element.src);
  }
  if (isSVGElement(element)) {
    return getAbsoluteUrl(svgToTinyDataUri(element));
  }
  if (isHTMLCanvasElement(element)) {
    return getAbsoluteUrl(element.toDataURL("png"));
  }
  if (isHTMLVideoElement(element)) {
    return getAbsoluteUrl(element.src);
  }
  const { backgroundImage } = window.getComputedStyle(element);
  const backgroundImageUrl = backgroundImage.match(
    /url\(["']?([^"']*)["']?\)/
  )?.[1];
  if (typeof backgroundImageUrl !== "undefined") {
    return getAbsoluteUrl(backgroundImageUrl);
  }
  return undefined;
}

function isHTMLImageElement(element: Element): element is HTMLImageElement {
  try {
    return element instanceof HTMLImageElement;
  } catch {
    return false;
  }
}

function isSVGElement(element: Element): element is SVGElement {
  try {
    return element instanceof SVGElement;
  } catch {
    return false;
  }
}

function isHTMLCanvasElement(element: Element): element is HTMLCanvasElement {
  try {
    return element instanceof HTMLCanvasElement;
  } catch {
    return false;
  }
}

function isHTMLVideoElement(element: Element): element is HTMLVideoElement {
  try {
    return element instanceof HTMLVideoElement;
  } catch {
    return false;
  }
}

function isElementVisible(element: Element): boolean {
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

function svgToTinyDataUri(svg: SVGElement): string {
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

const getAbsoluteUrl = (() => {
  let a: HTMLAnchorElement | undefined;
  return (url: string) => {
    if (!a) a = document.createElement("a");
    a.href = url;
    return a.href;
  };
})();
