import React, { useMemo } from "react";
import {
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  Divider,
  Grid,
  Box,
  Link,
} from "@mui/material";

import {
  useBartenderOptionsStore,
  useHydration,
  copyBehaviors,
  openTargets,
  openBehaviors,
  detectRegions,
} from "../../common";
import { useSwitchControl, SwitchControl } from "./SwitchControl";
import { useNumberControl, NumberControl } from "./NumberControl";
import { useSelectControl, SelectControl } from "./SelectControl";

function useAutoTheme() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );
  return theme;
}

function App() {
  const theme = useAutoTheme();

  const hasHydrated = useHydration(useBartenderOptionsStore);

  const [detectRegion, handleDetectRegionChange] = useSelectControl(
    "detectRegion",
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
          margin: 2,
        }}
      >
        <Grid container spacing={1} alignItems={"center"}>
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
            <NumberControl
              label="Tolerance"
              value={tolerance}
              onChange={handleToleranceChange}
              step={1}
              endAdornment="px"
              disabled={detectRegion !== "under-cursor"}
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
