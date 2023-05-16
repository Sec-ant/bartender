import { BartenderOptionsState } from "./store.js";

/**
 * A message sent when the context menu is opened.
 */
export interface DetectionPrepareMessage {
  type: "detection-prepare";
  target: "service-worker";
  payload: {
    x: number;
    y: number;
    ew: number;
    eh: number;
    vw: number;
    vh: number;
    imageUrl: string | undefined;
  };
}

/**
 * A message to write to the clipboard.
 */
export interface ClipboardWriteMessage {
  type: "clipboard-write";
  target: "offscreen";
  payload: {
    contents: string[];
    copyInterval: number;
    maxCopyCount: number;
  };
}

/**
 * A message to sync the option.
 */
export interface OptionSyncMessage<T extends keyof BartenderOptionsState> {
  type: "option-sync";
  target: "options";
  payload: {
    stateName: T;
    state: BartenderOptionsState[T];
  };
}

export interface PageSelectMessage {
  type: "page-select";
  target: "content-script";
  payload: null;
}

/**
 * A type representing a message.
 */
export type Message =
  | DetectionPrepareMessage
  | ClipboardWriteMessage
  | OptionSyncMessage<never>
  | PageSelectMessage;
