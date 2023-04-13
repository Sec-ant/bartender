import { create } from "zustand";
import {
  StateStorage,
  createJSONStorage,
  persist,
  PersistOptions,
} from "zustand/middleware";

const browserSyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await chrome.storage.sync.get(name))[name] ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.sync.set({
      [name]: value,
    });
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.sync.remove(name);
  },
};

export const openTargets = [
  "one-tab-each",
  "one-window-each",
  "one-window-all",
] as const;

export type OpenTarget = typeof openTargets[number];

export const openBehaviors = [
  "open-first",
  "open-last",
  "open-all",
  "open-all-reverse",
] as const;

export type OpenBehavior = typeof openBehaviors[number];

export const copyBehaviors = [
  "copy-first",
  "copy-last",
  "copy-all",
  "copy-all-reverse",
] as const;

export type CopyBehavior = typeof copyBehaviors[number];

export interface BartenderOptionsPersistState {
  openUrl: boolean;
  changeFocus: boolean;
  openTarget: OpenTarget;
  openBehavior: OpenBehavior;
  maxUrlCount: number;

  copyToClipboard: boolean;
  copyBehavior: CopyBehavior;
  copyInterval: number;
  maxCopyCount: number;
}

export const defaultBartenderOptionsPersistState: BartenderOptionsPersistState =
  {
    openUrl: true,
    changeFocus: false,
    openTarget: "one-tab-each",
    openBehavior: "open-all",
    maxUrlCount: 1000,

    copyToClipboard: true,
    copyBehavior: "copy-all",
    copyInterval: 300,
    maxCopyCount: 1000,
  };

interface BartenderOptionsState extends BartenderOptionsPersistState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const browserSyncStoragePersistOptions: PersistOptions<
  BartenderOptionsState,
  unknown
> = {
  name: "bartender-options",
  version: 0,
  storage: createJSONStorage(() => browserSyncStorage),
  partialize: (state) =>
    Object.fromEntries(
      Object.entries(state).filter(
        ([key]) => !["_hasHydrated", "setHasHydrated"].includes(key)
      )
    ),
  onRehydrateStorage: () => (state) => {
    state?.setHasHydrated(true);
  },
};

export const useBartenderOptionsStore = create<BartenderOptionsState>()(
  persist(
    (set) => ({
      ...defaultBartenderOptionsPersistState,
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated });
      },
    }),
    browserSyncStoragePersistOptions
  )
);
