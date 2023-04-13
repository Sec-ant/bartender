/// <reference types="chrome-types"/>
declare interface ContextMenuOpenedMessage {
  type: "context-menu-opened";
  target: "service-worker";
  payload: {
    x: number;
    y: number;
    imageUrl: string | undefined;
  };
}
declare interface WriteClipboardMessage {
  type: "clipboard";
  target: "offscreen";
  payload: {
    contents: string[];
  };
}

declare type Message = ContextMenuOpenedMessage | WriteClipboardMessage;
