import React, { useState, useCallback } from "react";
import { Autocomplete, TextField, Skeleton, styled } from "@mui/material";
import type { AutocompleteProps } from "@mui/material";

import {
  BartenderOptionsState,
  UseBatenderOptionsStore,
  KeysMatching,
} from "../../common";
import { useStoreState } from "../utils";

/**
 * A type representing a function to handle changes to an EditableMultiSelectControl.
 */
type OnEditableMultiSelectControlChange = Exclude<
  AutocompleteProps<string, true, false, true>["onChange"],
  undefined
>;

/**
 * A type representing a function to handle changes to the input value of an EditableMultiSelectControl.
 */
export type OnInputChange = Exclude<
  AutocompleteProps<string, true, false, true>["onInputChange"],
  undefined
>;

/**
 * A type representing a function to consolidate the state and input value of an EditableMultiSelectControl.
 */
export type Consolidate = (
  state: string[],
  input: string
) => [string[], string];

/**
 * A hook for using an editable multi-select control.
 * @template T - The type of the stateName.
 * @param {T} stateName - The name of the state to use.
 * @param {boolean} hasHydrated - Whether the component has hydrated.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @param {Consolidate} consolidate - A function to consolidate the input value and the state.
 * @param {number} [wait=250] - The wait time in milliseconds.
 * @returns {[string[], OnEditableMultiSelectControlChange, string, OnInputChange]} - The state, the change event handler for the select control, the input state, and the change event handler for the input control.
 */
export function useEditableMultiSelectControl<
  T extends KeysMatching<BartenderOptionsState, string[]>
>(
  stateName: T,
  hasHydrated: boolean,
  useStore: UseBatenderOptionsStore,
  consolidate: Consolidate,
  wait = 250
): [string[], OnEditableMultiSelectControlChange, string, OnInputChange] {
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

  return [state, handleStateChange, inputState, handleInputValueChange];
}

const MyAutoComplete = styled(Autocomplete<string, true, false, true>)({
  "& .MuiAutocomplete-inputRoot": {
    "& .MuiAutocomplete-input:first-of-type": {
      minWidth: 0,
    },
  },
});

/**
 * An EditableMultiSelectControl component.
 * @param {Object} props - The props for the component.
 * @param {string} props.label - The label for the select control.
 * @param {string[]} props.value - The current value of the select control.
 * @param {OnEditableMultiSelectControlChange} props.onChange - The change event handler for the select control.
 * @param {string} [props.inputValue] - The current value of the input control.
 * @param {OnInputChange} [props.onInputChange] - The change event handler for the input control.
 * @param {readonly string[]} props.valueOptions - The options for the select control.
 * @param {string} [props.placeholder] - The placeholder for the input control.
 * @param {boolean} [props.hydrated=true] - Whether the component is hydrated.
 * @param {boolean} [props.disabled=false] - Whether the select control is disabled.
 */
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
      autoSelect
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
