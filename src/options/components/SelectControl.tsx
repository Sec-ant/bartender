import React, { useCallback, ChangeEventHandler } from "react";
import { TextField, Skeleton } from "@mui/material";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  SelectType,
  KeysMatching,
} from "../../common";
import { useStoreState } from "../utils";

/**
 * A hook for using a select control.
 * @template T - The type of the stateName.
 * @param {T} stateName - The name of the state to use.
 * @param {boolean} hasHydrated - Whether the component has hydrated.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @param {(s: string) => BartenderOptionsState[T]} [typecast] - A function to typecast the value.
 * @param {number} [wait=250] - The wait time in milliseconds.
 * @returns {[BartenderOptionsState[T], ChangeEventHandler<HTMLInputElement>]} - The state and the change event handler.
 */
export function useSelectControl<
  T extends KeysMatching<BartenderOptionsState, SelectType>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  typecast: (s: string) => BartenderOptionsState[T] = (s) =>
    s as BartenderOptionsState[T],
  wait = 250
): [BartenderOptionsState[T], ChangeEventHandler<HTMLInputElement>] {
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
      const typecastedValue = typecast(value);
      setState(typecastedValue);
    },
    [hasHydrated, typecast, setState]
  );

  return [state, handleStateChange];
}

/**
 * A select control component.
 * @template T - The type of the value.
 * @param {Object} props - The props for the component.
 * @param {string} props.label - The label for the select control.
 * @param {BartenderOptionsState[T]} props.value - The current value of the select control.
 * @param {ChangeEventHandler<HTMLInputElement>} props.onChange - The change event handler for the select control.
 * @param {readonly BartenderOptionsState[T][]} props.valueOptions - The options for the select control.
 * @param {(valueOption: BartenderOptionsState[T]) => string} [props.valueOptionMap] - A function to map value options to display strings.
 * @param {boolean} [props.hydrated=true] - Whether the component is hydrated.
 * @param {boolean} [props.disabled=false] - Whether the select control is disabled.
 */
export function SelectControl<
  T extends KeysMatching<BartenderOptionsState, SelectType>
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
  onChange: ChangeEventHandler<HTMLInputElement>;
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
