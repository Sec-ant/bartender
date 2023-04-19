import { BartenderOptionsState } from "./store.js";

export interface ContextMenuOpenedMessage {
  type: "context-menu-opened";
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
export interface WriteClipboardMessage {
  type: "clipboard";
  target: "offscreen";
  payload: {
    contents: string[];
    copyInterval: number;
    maxCopyCount: number;
  };
}

export interface StateUpdateMessage<T extends keyof BartenderOptionsState> {
  type: "state-update";
  target: "options";
  payload: {
    stateName: T;
    state: BartenderOptionsState[T];
  };
}

export type Message =
  | ContextMenuOpenedMessage
  | WriteClipboardMessage
  | StateUpdateMessage<never>;
