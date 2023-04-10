import { createStore } from "zustand/vanilla";
import { initWasm as initResvgWasm } from "@resvg/resvg-wasm";

interface BartenderState {
  x: number;
  y: number;
  imageUrlPromise: Promise<string | undefined>;
  resvgWasmPromise: Promise<void>;
}

export const bartenderStore = createStore<BartenderState>()(() => ({
  x: NaN,
  y: NaN,
  imageUrlPromise: Promise.resolve(undefined),
  resvgWasmPromise: initResvgWasm(
    fetch(
      `https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@${__RESVG_WASM_VERSION__}/index_bg.wasm`
    )
  ),
}));
