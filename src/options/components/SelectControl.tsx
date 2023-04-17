import { useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TextField, Skeleton } from "@mui/material";

import { useRehydrationEffect } from "../utils";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  SelectType,
} from "../../common";
import { KeysMatching } from "../utils";

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
  const [state, setState] = useState(useStore.getState()[stateName]);
  const debounced = useDebouncedCallback(
    (state: BartenderOptionsState[T]) => {
      useStore.setState({
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
        setState(typecastedValue);
        debounced(typecastedValue);
      },
      [debounced, hasHydrated]
    );
  useEffect(() => {
    if (hasHydrated === true) {
      setState(useStore.getState()[stateName]);
    }
  }, [hasHydrated]);

  const rehydrationCallback = useCallback(async () => {
    await useStore.persist.rehydrate();
    setState(useStore.getState()[stateName]);
  }, [useStore, stateName]);
  useRehydrationEffect(rehydrationCallback);

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
