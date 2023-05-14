import React, { useState, useCallback } from "react";
import { Autocomplete, TextField, Skeleton, styled } from "@mui/material";
import type { AutocompleteProps } from "@mui/material";

import { BartenderOptionsState, UseBatenderOptionsStore } from "../../common";
import { KeysMatching, useStoreState } from "../utils";

type OnEditableMultiSelectControlChange = Exclude<
  AutocompleteProps<string, true, false, true>["onChange"],
  undefined
>;

export type OnInputChange = Exclude<
  AutocompleteProps<string, true, false, true>["onInputChange"],
  undefined
>;

export type Consolidate = (
  state: string[],
  input: string
) => [string[], string];

export function useEditableMultiSelectControl<
  T extends KeysMatching<BartenderOptionsState, string[]>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  consolidate: Consolidate,
  wait = 250
) {
  const [state, setState] = useStoreState(
    stateName,
    useStore,
    hasHydrated,
    wait
  );

  const handleStateChange = useCallback<OnEditableMultiSelectControlChange>(
    (_, value) => {
      if (hasHydrated === false) {
        return;
      }
      setState(value);
    },
    [hasHydrated, setState]
  );

  const [inputState, setInputState] = useState("");

  const handleInputValueChange = useCallback<OnInputChange>(
    (_, inputValue) => {
      if (hasHydrated === false) {
        return;
      }
      setState((prevState) => {
        const [newState, newInputState] = consolidate(prevState, inputValue);
        setInputState(newInputState);
        return newState;
      });
    },
    [hasHydrated, setState, consolidate]
  );

  return [
    state,
    handleStateChange,
    inputState,
    handleInputValueChange,
  ] as const;
}

const MyAutoComplete = styled(Autocomplete<string, true, false, true>)({
  "& .MuiAutocomplete-inputRoot": {
    "& .MuiAutocomplete-input:first-of-type": {
      minWidth: 0,
    },
  },
});

export function EditableMultiSelectControl({
  label,
  value,
  onChange,
  inputValue,
  onInputChange,
  valueOptions,
  placeholder,
  hydrated = true,
  disabled = false,
}: {
  label: string;
  value: string[];
  onChange: OnEditableMultiSelectControlChange;
  inputValue?: string;
  onInputChange?: OnInputChange;
  valueOptions: readonly string[];
  placeholder?: string;
  hydrated?: boolean;
  disabled?: boolean;
}) {
  type InputRender = Exclude<
    AutocompleteProps<string, true, false, true>["renderInput"],
    undefined
  >;
  const inputRender = useCallback<InputRender>(
    (params) => (
      <TextField
        {...params}
        label={label}
        placeholder={value.length ? undefined : placeholder}
        InputLabelProps={{
          shrink: true,
        }}
      />
    ),
    [label, value, placeholder]
  );
  return hydrated ? (
    <MyAutoComplete
      multiple
      fullWidth
      size="small"
      limitTags={1}
      options={valueOptions}
      freeSolo
      disableCloseOnSelect
      renderInput={inputRender}
      inputValue={inputValue}
      onInputChange={onInputChange}
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
