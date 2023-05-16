import React, { useCallback, useMemo } from "react";
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  Divider,
  Grid,
  Box,
  Link,
  Theme,
} from "@mui/material";

import {
  useBartenderOptionsStore,
  useHydration,
  copyBehaviors,
  openTargets,
  openBehaviors,
  detectRegions,
  commonURLSchemes as commonUrlSchemes,
} from "../../common";
import { useSwitchControl, SwitchControl } from "./SwitchControl";
import { useNumberControl, NumberControl } from "./NumberControl";
import { useSelectControl, SelectControl } from "./SelectControl";
import {
  Consolidate,
  useEditableMultiSelectControl,
  EditableMultiSelectControl,
} from "./EditableMultiSelectControl";

/**
 * A hook for using an auto theme.
 * @returns {Theme} - The theme.
 */
function useAutoTheme(): Theme {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              html: {
                overflowY: "auto",
                scrollbarGutter: "stable",
              },
            },
          },
        },
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );
  return theme;
}

/**
 * The App component.
 */
function App() {
  const theme = useAutoTheme();

  const hasHydrated = useHydration(useBartenderOptionsStore);

  const [detectRegion, handleDetectRegionChange] = useSelectControl(
    "detectRegion",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [fallbackToUnderCursor, handleFallbackToUnderCursorChange] =
    useSwitchControl(
      "fallbackToUnderCursor",
      hasHydrated,
      useBartenderOptionsStore
    );

  const [tolerance, handleToleranceChange] = useNumberControl(
    "tolerance",
    hasHydrated,
    useBartenderOptionsStore,
    (s) => parseFloat(s || "0")
  );

  const [openUrl, handleOpenUrlChange] = useSwitchControl(
    "openUrl",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [changeFocus, handleChangeFocusChange] = useSwitchControl(
    "changeFocus",
    hasHydrated,
    useBartenderOptionsStore
  );

  const consolidateUrlSchemes = useCallback<Consolidate>(
    (prevState, inputValue) => {
      const matchResults = inputValue.matchAll(
        /([a-z](?:[a-z]|\d|\+|-|\.)*)([^a-z]*)/gi
      );
      let newInputValue = "";
      for (const [, scheme, delimiter] of matchResults) {
        if (delimiter) {
          prevState.push(scheme.toLowerCase());
        } else {
          newInputValue = scheme.toLowerCase();
        }
      }
      const newState = [...new Set(prevState)];
      return [newState, newInputValue];
    },
    []
  );

  const [
    urlSchemeWhitelist,
    handleUrlSchemeWhitelistChange,
    urlSchemeWhitelistInputValue,
    handleUrlSchemeWhitelistInputChange,
  ] = useEditableMultiSelectControl(
    "urlSchemeWhitelist",
    hasHydrated,
    useBartenderOptionsStore,
    consolidateUrlSchemes
  );

  const [
    urlSchemeBlacklist,
    handleUrlSchemeBlacklistChange,
    urlSchemeBlacklistInputValue,
    handleUrlSchemeBlacklistInputChange,
  ] = useEditableMultiSelectControl(
    "urlSchemeBlacklist",
    hasHydrated,
    useBartenderOptionsStore,
    consolidateUrlSchemes
  );

  const [openTarget, handleOpenTargetChange] = useSelectControl(
    "openTarget",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [openBehavior, handleOpenBehaviorChange] = useSelectControl(
    "openBehavior",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [maxUrlCount, handleMaxUrlCountChange] = useNumberControl(
    "maxUrlCount",
    hasHydrated,
    useBartenderOptionsStore,
    (stringValue) => parseInt(stringValue || "1")
  );

  const [copyToClipboard, handleCopyToClipboardChange] = useSwitchControl(
    "copyToClipboard",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [copyBehavior, handleCopyBehaviorChange] = useSelectControl(
    "copyBehavior",
    hasHydrated,
    useBartenderOptionsStore
  );

  const [copyInterval, handleCopyIntervalChange] = useNumberControl(
    "copyInterval",
    hasHydrated,
    useBartenderOptionsStore,
    (stringValue) => parseFloat(stringValue || "0")
  );

  const [maxCopyCount, handleMaxCopyCountChange] = useNumberControl(
    "maxCopyCount",
    hasHydrated,
    useBartenderOptionsStore,
    (stringValue) => parseInt(stringValue || "1")
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="div"
        sx={{
          marginLeft: 2,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        <Grid container spacing={2} alignItems={"center"}>
          <Grid item xs={6}>
            <SelectControl
              label="Detect Region"
              value={detectRegion}
              onChange={handleDetectRegionChange}
              valueOptions={detectRegions}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <SwitchControl
              label="Fallback To Under Cursor"
              value={fallbackToUnderCursor}
              onChange={handleFallbackToUnderCursorChange}
              hydrated={hasHydrated}
              disabled={!(detectRegion === "dom-element")}
            />
          </Grid>
          <Grid item xs={6}>
            <NumberControl
              label="Cursor Position Tolerance"
              value={tolerance}
              onChange={handleToleranceChange}
              step={1}
              endAdornment="px"
              disabled={
                !(
                  detectRegion === "under-cursor" ||
                  (detectRegion === "dom-element" && fallbackToUnderCursor)
                )
              }
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={6}>
            <SwitchControl
              label="Auto open URL"
              value={openUrl}
              onChange={handleOpenUrlChange}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <SwitchControl
              label="Auto change focus"
              value={changeFocus}
              onChange={handleChangeFocusChange}
              disabled={!openUrl}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <EditableMultiSelectControl
              label="URL Scheme Whitelist"
              placeholder="*"
              valueOptions={commonUrlSchemes}
              value={urlSchemeWhitelist}
              onChange={handleUrlSchemeWhitelistChange}
              inputValue={urlSchemeWhitelistInputValue}
              onInputChange={handleUrlSchemeWhitelistInputChange}
              disabled={!openUrl}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <EditableMultiSelectControl
              label="URL Scheme Blacklist"
              valueOptions={commonUrlSchemes}
              value={urlSchemeBlacklist}
              onChange={handleUrlSchemeBlacklistChange}
              inputValue={urlSchemeBlacklistInputValue}
              onInputChange={handleUrlSchemeBlacklistInputChange}
              disabled={!openUrl || urlSchemeWhitelist.length > 0}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <SelectControl
              label="Target of open"
              value={openTarget}
              onChange={handleOpenTargetChange}
              valueOptions={openTargets}
              disabled={!openUrl}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <SelectControl
              label="Behavior of open"
              value={openBehavior}
              onChange={handleOpenBehaviorChange}
              valueOptions={openBehaviors}
              disabled={!openUrl}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <NumberControl
              label="Max count of URL"
              value={maxUrlCount}
              onChange={handleMaxUrlCountChange}
              min={1}
              step={1}
              disabled={
                !openUrl ||
                openBehavior === "open-first" ||
                openBehavior === "open-last"
              }
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={6}>
            <SwitchControl
              label="Auto copy to clipboard"
              value={copyToClipboard}
              onChange={handleCopyToClipboardChange}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <SelectControl
              label="Behavior of copy"
              value={copyBehavior}
              onChange={handleCopyBehaviorChange}
              valueOptions={copyBehaviors}
              disabled={!copyToClipboard}
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <NumberControl
              label="Interval of copy"
              value={copyInterval}
              onChange={handleCopyIntervalChange}
              min={0}
              step={1}
              endAdornment="ms"
              disabled={
                !copyToClipboard ||
                copyBehavior === "copy-first" ||
                copyBehavior === "copy-last"
              }
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={6}>
            <NumberControl
              label="Max count of copy"
              value={maxCopyCount}
              onChange={handleMaxCopyCountChange}
              min={1}
              step={1}
              disabled={
                !copyToClipboard ||
                copyBehavior === "copy-first" ||
                copyBehavior === "copy-last"
              }
              hydrated={hasHydrated}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Link href={window.location.href} target="_blank">
              Open In New Tab
            </Link>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
