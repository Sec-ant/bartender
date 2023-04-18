import React, { useCallback, ChangeEventHandler } from "react";
import { TextField, Skeleton } from "@mui/material";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  SelectType,
} from "../../common";
import { KeysMatching, useStoreState } from "../utils";

export function useSelectControl<
  T extends KeysMatching<BartenderOptionsState, SelectType>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  typecast: (s: string) => BartenderOptionsState[T] = (s) =>
    s as BartenderOptionsState[T],
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
      const typecastedValue = typecast(value);
      setState(typecastedValue);
    },
    [hasHydrated, typecast, setState]
  );

  return [state, handleStateChange] as const;
}

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
