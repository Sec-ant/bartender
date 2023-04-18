import React, { useCallback, ChangeEventHandler } from "react";
import { FormControlLabel, Switch, Typography, Skeleton } from "@mui/material";

import { BartenderOptionsState, UseBatenderOptionsStore } from "../../common";
import { KeysMatching, useStoreState } from "../utils";

export function useSwitchControl<
  T extends KeysMatching<BartenderOptionsState, boolean>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  wait = 250
) {
  const [state, setState] = useStoreState(
    stateName,
    useStore,
    hasHydrated,
    wait
  );

  const handleStateChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    ({ target: { checked } }) => {
      if (hasHydrated === false) {
        return;
      }
      setState(checked);
    },
    [hasHydrated, setState]
  );

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
  onChange: ChangeEventHandler<HTMLInputElement>;
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
