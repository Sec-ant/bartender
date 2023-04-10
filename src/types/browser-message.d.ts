declare interface BrowserContextMenuMessage {
  type: "context-menu";
  value: {
    x: number;
    y: number;
    imageUrl: string | undefined;
  };
}

declare type BrowserMessage = BrowserContextMenuMessage;
