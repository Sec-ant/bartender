import { useEffect, useState } from "react";
import { create } from "zustand";
import {
  StateStorage,
  createJSONStorage,
  persist,
  PersistOptions,
} from "zustand/middleware";

/**
 * A StateStorage implementation that uses the Chrome sync storage.
 */
const browserSyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await chrome.storage.sync.get(name))[name] ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const currentValue = (await chrome.storage.sync.get(name))[name] ?? null;
    if (currentValue === value) {
      return;
    }
    await chrome.storage.sync.set({
      [name]: value,
    });
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.sync.remove(name);
  },
};

/**
 * The default URL schemes to whitelist.
 */
export const defaultUrlSchemeWhitelist = ["http", "https"];

/**
 * The default URL schemes to blacklist.
 */
export const defaultUrlSchemeBlacklist = [];

/**
 * Common URL schemes.
 */
export const commonURLSchemes = [
  ...defaultUrlSchemeWhitelist,
  "about",
  "blob",
  "brave",
  "chrome",
  "chrome-extension",
  "cid",
  "content",
  "data",
  "devtools",
  "edge",
  "extension",
  "file",
  "ftp",
  "ipfs",
  "ipns",
  "magnet",
  "mailto",
  "moz-extension",
  "opera",
  "sftp",
  "smb",
  "socks5",
  "ssh",
  "tel",
  "view-source",
  "webcal",
  "ws",
  "wss",
];

/**
 * The regions to detect.
 */
export const detectRegions = [
  "dom-element",
  "whole-page",
  "under-cursor",
] as const;

/**
 * A type representing a region to detect.
 */
export type DetectRegion = (typeof detectRegions)[number];

/**
 * The targets to open.
 */
export const openTargets = [
  "one-tab-each",
  "one-window-each",
  "one-window-all",
] as const;

/**
 * A type representing a target to open.
 */
export type OpenTarget = (typeof openTargets)[number];

/**
 * The behaviors when opening.
 */
export const openBehaviors = [
  "open-first",
  "open-last",
  "open-all",
  "open-all-reverse",
] as const;

/**
 * A type representing a behavior when opening.
 */
export type OpenBehavior = (typeof openBehaviors)[number];

/**
 * The behaviors when copying.
 */
export const copyBehaviors = [
  "copy-first",
  "copy-last",
  "copy-all",
  "copy-all-reverse",
] as const;

/**
 * A type representing a behavior when copying.
 */
export type CopyBehavior = (typeof copyBehaviors)[number];

/**
 * A type representing a select type.
 */
export type SelectType =
  | DetectRegion
  | OpenTarget
  | OpenBehavior
  | CopyBehavior;

/**
 * The state of the bartender options.
 */
export interface BartenderOptionsState {
  detectRegion: DetectRegion;
  fallbackToUnderCursor: boolean;
  tolerance: number;

  openUrl: boolean;
  urlSchemeWhitelist: string[];
  urlSchemeBlacklist: string[];
  changeFocus: boolean;
  openTarget: OpenTarget;
  openBehavior: OpenBehavior;
  maxUrlCount: number;

  copyToClipboard: boolean;
  copyBehavior: CopyBehavior;
  copyInterval: number;
  maxCopyCount: number;
}

/**
 * The default state of the bartender options.
 */
export const defaultBartenderOptionsState: BartenderOptionsState = {
  detectRegion: "dom-element",
  fallbackToUnderCursor: true,
  tolerance: 0,

  openUrl: true,
  urlSchemeWhitelist: defaultUrlSchemeWhitelist,
  urlSchemeBlacklist: [],
  changeFocus: false,
  openTarget: "one-tab-each",
  openBehavior: "open-all",
  maxUrlCount: 1000,

  copyToClipboard: true,
  copyBehavior: "copy-all",
  copyInterval: 300,
  maxCopyCount: 1000,
};

/**
 * The options for persisting the bartender options state using the Chrome sync storage.
 */
const browserSyncStoragePersistOptions: PersistOptions<
  BartenderOptionsState,
  unknown
> = {
  name: "bartender-options",
  version: 0,
  storage: createJSONStorage(() => browserSyncStorage),
};

/**
 * A hook to use the bartender options store.
 */
export const useBartenderOptionsStore = create<BartenderOptionsState>()(
  persist(() => defaultBartenderOptionsState, browserSyncStoragePersistOptions)
);

/**
 * The type of the useBartenderOptionsStore hook.
 */
export type UseBatenderOptionsStore = typeof useBartenderOptionsStore;

/**
 * A hook to use hydration.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @returns {boolean} - Whether the store has been hydrated.
 */
export const useHydration = (useStore: UseBatenderOptionsStore): boolean => {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useStore.persist.hasHydrated());
    return unsub;
  }, [useStore]);

  return hydrated;
};
