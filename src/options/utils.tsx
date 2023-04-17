import { useEffect } from "react";

export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export function useRehydrationEffect(callback: () => Promise<void>) {
  useEffect(() => {
    chrome.storage.onChanged.addListener(callback);
    return () => {
      chrome.storage.onChanged.removeListener(callback);
    };
  }, []);
}
