import React, { useCallback, ChangeEventHandler } from "react";
import { FormControlLabel, Switch, Typography, Skeleton } from "@mui/material";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  KeysMatching,
} from "../../common";
import { useStoreState } from "../utils";

/**
 * A hook for using a switch control.
 * @template T - The type of the stateName.
 * @param {T} stateName - The name of the state to use.
 * @param {boolean} hasHydrated - Whether the component has hydrated.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @param {number} [wait=250] - The wait time in milliseconds.
 * @returns {[boolean, ChangeEventHandler<HTMLInputElement>]} - The state and the change event handler.
 */
export function useSwitchControl<
  T extends KeysMatching<BartenderOptionsState, boolean>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  wait = 250
): [boolean, ChangeEventHandler<HTMLInputElement>] {
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

  return [state, handleStateChange];
}

/**
 * A SwitchControl component.
 * @template T - The type of the value.
 * @param {Object} props - The props for the component.
 * @param {string} props.label - The label for the switch control.
 * @param {BartenderOptionsState[T]} props.value - The current value of the switch control.
 * @param {ChangeEventHandler<HTMLInputElement>} props.onChange - The change event handler for the switch control.
 * @param {boolean} [props.hydrated=true] - Whether the component is hydrated.
 * @param {boolean} [props.disabled=false] - Whether the switch control is disabled.
 */
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
