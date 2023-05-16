import React, { useCallback, MouseEventHandler } from "react";
import { Divider, MenuList, MenuItem, ListItemText, Link } from "@mui/material";

import { PageSelectMessage } from "../../common";

const optionsPageUrl = chrome.runtime.getURL("options.html");

export default function App() {
  const handleSelectAndDetectClick = useCallback<
    MouseEventHandler<HTMLLIElement>
  >(async () => {
    const message: PageSelectMessage = {
      type: "page-select",
      target: "content-script",
      payload: null,
    };
    const [{ id }] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    await chrome.tabs.sendMessage(id as number, message);
    await chrome.runtime.sendMessage(message);
  }, []);

  return (
    <MenuList dense disablePadding>
      <MenuItem onClick={handleSelectAndDetectClick}>
        <ListItemText>Select and Detect</ListItemText>
      </MenuItem>
      <Divider />
      <Link href={optionsPageUrl} target="_blank">
        <MenuItem>
          <ListItemText>Bartender Options</ListItemText>
        </MenuItem>
      </Link>
    </MenuList>
  );
}
