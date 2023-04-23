import React, { useCallback, ChangeEventHandler } from "react";
import { TextField, InputAdornment, Skeleton } from "@mui/material";

import { BartenderOptionsState, UseBatenderOptionsStore } from "../../common";
import {
  KeysMatching,
  useStoreState,
  useStopWheelPropagationCallbackRef,
} from "../utils";

export function useNumberControl<
  T extends KeysMatching<BartenderOptionsState, number>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  stringToNumber: (s: string) => number = (s) => parseFloat(s),
  wait = 250
) {
  const [state, setState] = useStoreState(
    stateName,
    useStore,
    hasHydrated,
    wait
  );

  const handleStateChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    ({ target: { value } }) => {
      if (hasHydrated === false) {
        return;
      }
      const numericValue = stringToNumber(value);
      setState(numericValue);
    },
    [hasHydrated, stringToNumber, setState]
  );

  return [state, handleStateChange] as const;
}

export function NumberControl<
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
  onChange: ChangeEventHandler<HTMLInputElement>;
  min?: number;
  step?: number;
  endAdornment?: string;
  hydrated?: boolean;
  disabled?: boolean;
}) {
  const callbackRef = useStopWheelPropagationCallbackRef<HTMLInputElement>();

  return hydrated ? (
    <TextField
      fullWidth
      size="small"
      label={label}
      type="number"
      ref={callbackRef}
      inputProps={{
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
