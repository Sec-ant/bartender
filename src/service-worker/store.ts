import { createStore, StoreApi } from "zustand/vanilla";
import { initWasm as initResvgWasm } from "@resvg/resvg-wasm";
import type { DetectRegion } from "../common/store.js";

interface BartenderState {
  xRatio: number;
  yRatio: number;
  toleranceRatio: number;
  finalizedDetectRegion: DetectRegion;
  getImageData: () => Promise<ImageData | undefined>;
  loadResvgTask: Promise<void>;
  detectBarcodeTask: Promise<unknown>;
}

/**
 * The store for the bartender state.
 * @type {StoreApi<BartenderState>}
 */
export const bartenderStore: StoreApi<BartenderState> =
  createStore<BartenderState>()(() => ({
    xRatio: NaN,
    yRatio: NaN,
    toleranceRatio: NaN,
    finalizedDetectRegion: "under-cursor",
    getImageData: async () => undefined,
    loadResvgTask: initResvgWasm(
      fetch(
        `https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@${__RESVG_WASM_VERSION__}/index_bg.wasm`
      )
    ),
    detectBarcodeTask: Promise.resolve(),
  }));
