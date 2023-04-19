import { createStore } from "zustand/vanilla";
import { initWasm as initResvgWasm } from "@resvg/resvg-wasm";

interface BartenderState {
  xRatio: number;
  yRatio: number;
  imageUrlPromise: Promise<string | undefined>;
  loadResvgTask: Promise<void>;
  detectBarcodeTask: Promise<unknown>;
}

export const bartenderStore = createStore<BartenderState>()(() => ({
  xRatio: NaN,
  yRatio: NaN,
  imageUrlPromise: Promise.resolve(undefined),
  loadResvgTask: initResvgWasm(
    fetch(
      `https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@${__RESVG_WASM_VERSION__}/index_bg.wasm`
    )
  ),
  detectBarcodeTask: Promise.resolve(),
}));
