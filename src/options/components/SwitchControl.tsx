import { useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { FormControlLabel, Switch, Typography, Skeleton } from "@mui/material";

import { BartenderOptionsState, UseBatenderOptionsStore } from "../../common";
import { KeysMatching, useRehydrationEffect } from "../utils";

export function useSwitchControl<
  T extends KeysMatching<BartenderOptionsState, boolean>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  wait = 250
) {
  const [state, setState] = useState(useStore.getState()[stateName]);
  const debounced = useDebouncedCallback(
    (state) => {
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

export function SwitchControl<
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
