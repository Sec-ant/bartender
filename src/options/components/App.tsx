import {
  useBartenderOptionsStore,
  useHydration,
  copyBehaviors,
  CopyBehavior,
  BartenderOptionsState,
  OpenTarget,
  OpenBehavior,
  openTargets,
  openBehaviors,
} from "../../common";
import { useDebouncedCallback } from "use-debounce";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Switch,
  TextField,
  FormControlLabel,
  Skeleton,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  createTheme,
  Divider,
  Grid,
  Box,
  Typography,
  InputAdornment,
} from "@mui/material";

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

type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

function useSwitchControl<
  T extends KeysMatching<BartenderOptionsState, boolean>
>(stateName: T, hasHydrated: boolean, wait = 250) {
  const [state, setState] = useState(
    useBartenderOptionsStore.getState()[stateName]
  );
  const debounced = useDebouncedCallback(
    (state) => {
      useBartenderOptionsStore.setState({
        [stateName]: state,
      });
    },
    wait,
    {
      trailing: true,
    }
  );
  const handleStateChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      ({ target: { checked } }) => {
        if (hasHydrated === false) {
          return;
        }
        setState(checked);
        debounced(checked);
      },
      [debounced, hasHydrated]
    );
  useEffect(() => {
    if (hasHydrated === true) {
      setState(useBartenderOptionsStore.getState()[stateName]);
    }
  }, [hasHydrated]);
  return [state, handleStateChange] as const;
}

function SwitchControl<
  T extends KeysMatching<BartenderOptionsState, boolean>
>({
  label,
  value,
  onChange,
  hydrated = true,
  disabled = false,
}: {
  label: string;
  value: BartenderOptionsState[T];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  hydrated?: boolean;
  disabled?: boolean;
}) {
  return hydrated ? (
    <FormControlLabel
      control={<Switch size="small" checked={value} onChange={onChange} />}
      label={
        <Typography
          variant="caption"
          style={{
            userSelect: "none",
          }}
        >
          {label}
        </Typography>
      }
      disabled={disabled}
    />
  ) : (
    <Skeleton variant="rounded" width="100%">
      <FormControlLabel
        control={<Switch size="small" />}
        label={<Typography variant="caption" />}
      />
    </Skeleton>
  );
}

function useNumberControl<
  T extends KeysMatching<BartenderOptionsState, number>
>(
  stateName: T,
  hasHydrated: boolean,
  stringToNumber: (s: string) => number = (s) => parseFloat(s),
  wait = 250
) {
  const [state, setState] = useState(
    useBartenderOptionsStore.getState()[stateName]
  );
  const debounced = useDebouncedCallback(
    (state) => {
      useBartenderOptionsStore.setState({
        [stateName]: state,
      });
    },
    wait,
    {
      trailing: true,
    }
  );
  const handleStateChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      ({ target: { value } }) => {
        if (hasHydrated === false) {
          return;
        }
        const numericValue = stringToNumber(value);
        setState(numericValue);
        debounced(numericValue);
      },
      [debounced, hasHydrated]
    );
  useEffect(() => {
    if (hasHydrated === true) {
      setState(useBartenderOptionsStore.getState()[stateName]);
    }
  }, [hasHydrated]);
  return [state, handleStateChange] as const;
}

function NumberControl<
  T extends KeysMatching<BartenderOptionsState, number>
>({
  label,
  value,
  onChange,
  min,
  step,
  endAdornment,
  hydrated = true,
  disabled = false,
}: {
  label: string;
  value: BartenderOptionsState[T];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  min?: number;
  step?: number;
  endAdornment?: string;
  hydrated?: boolean;
  disabled?: boolean;
}) {
  return hydrated ? (
    <TextField
      fullWidth
      size="small"
      label={label}
      type="number"
      inputProps={{
        //@ts-ignore
        ...(typeof min === "number" ? { min } : {}),
        ...(typeof step === "number" ? { step } : {}),
      }}
      InputProps={{
        ...(endAdornment
          ? {
              endAdornment: (
                <InputAdornment position="end">{endAdornment}</InputAdornment>
              ),
            }
          : {}),
      }}
      InputLabelProps={{
        shrink: true,
        size: "small",
      }}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  ) : (
    <Skeleton variant="rounded" width="100%">
      <TextField fullWidth size="small" />
    </Skeleton>
  );
}

function useSelectControl<
  T extends KeysMatching<
    BartenderOptionsState,
    OpenTarget | OpenBehavior | CopyBehavior
  >
>(
  stateName: T,
  hasHydrated: boolean,
  typecast: (s: string) => BartenderOptionsState[T] = (s) =>
    s as BartenderOptionsState[T],
  wait = 250
) {
  const [state, setState] = useState(
    useBartenderOptionsStore.getState()[stateName]
  );
  const debounced = useDebouncedCallback(
    (state: BartenderOptionsState[T]) => {
      useBartenderOptionsStore.setState({
        [stateName]: state,
      });
    },
    wait,
    {
      trailing: true,
    }
  );
  const handleStateChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      ({ target: { value } }) => {
        if (hasHydrated === false) {
          return;
        }
        const typecastedValue = typecast(value);
        // @ts-ignore
        setState(typecastedValue);
        debounced(typecastedValue);
      },
      [debounced, hasHydrated]
    );
  useEffect(() => {
    if (hasHydrated === true) {
      setState(useBartenderOptionsStore.getState()[stateName]);
    }
  }, [hasHydrated]);
  return [state, handleStateChange] as const;
}

function SelectControl<
  T extends KeysMatching<
    BartenderOptionsState,
    OpenTarget | OpenBehavior | CopyBehavior
  >
>({
  label,
  value,
  onChange,
  valueOptions,
  valueOptionMap = (valueOption) =>
    valueOption
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" "),
  hydrated = true,
  disabled = false,
}: {
  label: string;
  value: BartenderOptionsState[T];
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  valueOptions: readonly BartenderOptionsState[T][];
  valueOptionMap?: (valueOption: BartenderOptionsState[T]) => string;
  hydrated?: boolean;
  disabled?: boolean;
}) {
  return hydrated ? (
    <TextField
      fullWidth
      size="small"
      label={label}
      select
      SelectProps={{
        size: "small",
        native: true,
      }}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {valueOptions.map((stateOption) => (
        <option key={stateOption} value={stateOption}>
          {valueOptionMap(stateOption)}
        </option>
      ))}
    </TextField>
  ) : (
    <Skeleton variant="rounded" width="100%">
      <TextField fullWidth size="small" />
    </Skeleton>
  );
}

function App() {
  const theme = useAutoTheme();

  const hasHydrated = useHydration(useBartenderOptionsStore);

  const [openUrl, handleOpenUrlChange] = useSwitchControl(
    "openUrl",
    hasHydrated
  );

  const [changeFocus, handleChangeFocusChange] = useSwitchControl(
    "changeFocus",
    hasHydrated
  );

  const [openTarget, handleOpenTargetChange] = useSelectControl(
    "openTarget",
    hasHydrated
  );

  const [openBehavior, handleOpenBehaviorChange] = useSelectControl(
    "openBehavior",
    hasHydrated
  );

  const [maxUrlCount, handleMaxUrlCountChange] = useNumberControl(
    "maxUrlCount",
    hasHydrated,
    (stringValue) => parseInt(stringValue || "1")
  );

  const [copyToClipboard, handleCopyToClipboardChange] = useSwitchControl(
    "copyToClipboard",
    hasHydrated
  );

  const [copyBehavior, handleCopyBehaviorChange] = useSelectControl(
    "copyBehavior",
    hasHydrated
  );

  const [copyInterval, handleCopyIntervalChange] = useNumberControl(
    "copyInterval",
    hasHydrated,
    (stringValue) => parseFloat(stringValue || "0")
  );

  const [maxCopyCount, handleMaxCopyCountChange] = useNumberControl(
    "maxCopyCount",
    hasHydrated,
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
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
