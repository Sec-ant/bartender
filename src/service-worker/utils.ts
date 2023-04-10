import { Resvg } from "@resvg/resvg-wasm";
import { bartenderStore } from "./store.js";

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
