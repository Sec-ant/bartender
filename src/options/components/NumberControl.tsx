import React, { useCallback, ChangeEventHandler } from "react";
import { TextField, InputAdornment, Skeleton } from "@mui/material";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  KeysMatching,
} from "../../common";
import { useStoreState, useStopWheelPropagationCallbackRef } from "../utils";

/**
 * A hook for using a number control.
 * @template T - The type of the stateName.
 * @param {T} stateName - The name of the state to use.
 * @param {boolean} hasHydrated - Whether the component has hydrated.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @param {(s: string) => number} [stringToNumber] - A function to convert a string to a number.
 * @param {number} [wait=250] - The wait time in milliseconds.
 * @returns {[number, ChangeEventHandler<HTMLInputElement>]} - The state and the change event handler.
 */
export function useNumberControl<
  T extends KeysMatching<BartenderOptionsState, number>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  stringToNumber: (s: string) => number = (s) => parseFloat(s),
  wait = 250
): [number, ChangeEventHandler<HTMLInputElement>] {
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

  return [state, handleStateChange];
}

/**
 * A NumberControl component.
 * @template T - The type of the value.
 * @param {Object} props - The props for the component.
 * @param {string} props.label - The label for the number control.
 * @param {BartenderOptionsState[T]} props.value - The current value of the number control.
 * @param {ChangeEventHandler<HTMLInputElement>} props.onChange - The change event handler for the number control.
 * @param {number} [props.min] - The minimum value for the number control.
 * @param {number} [props.step] - The step size for the number control.
 * @param {string} [props.endAdornment] - The end adornment for the number control.
 * @param {boolean} [props.hydrated=true] - Whether the component is hydrated.
 * @param {boolean} [props.disabled=false] - Whether the number control is disabled.
 */
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
