declare interface ChromeUrlMessage {
  type: "url";
  value: {
    url: string | undefined;
  };
}
