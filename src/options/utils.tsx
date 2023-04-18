import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import debounce from "lodash.debounce";

import {
  UseBatenderOptionsStore,
  BartenderOptionsState,
  StateUpdateMessage,
  Message,
} from "../common";

export type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export function useStoreState<T extends keyof BartenderOptionsState>(
  stateName: T,
  useStore: UseBatenderOptionsStore,
  hasHydrated: boolean,
  wait?: number
) {
  const [state, setState] = useState(useStore.getState()[stateName]);

  const debouncedSetStoreFunction = useMemo(
    () =>
      debounce<(state: BartenderOptionsState[T]) => void>(
        (state) =>
          useStore.setState({
            [stateName]: state,
          }),
        wait
      ),
    [useStore, stateName, wait]
  );

  const debouncedSetStore = useCallback(
    (state: BartenderOptionsState[T]) => {
      debouncedSetStoreFunction(state);
    },
    [debouncedSetStoreFunction]
  );

  useEffect(() => {
    debouncedSetStore(state);
  }, [debouncedSetStore, state]);

  useStateMessageSync(stateName, state, setState);

  useEffect(() => {
    if (hasHydrated === true) {
      setState(useStore.getState()[stateName]);
    }
  }, [hasHydrated, useStore, stateName]);

  return [state, setState] as const;
}

function useStateMessageSync<T extends keyof BartenderOptionsState>(
  stateName: T,
  state: BartenderOptionsState[T],
  setState: Dispatch<SetStateAction<BartenderOptionsState[T]>>
) {
  useEffect(() => {
    const message: StateUpdateMessage<T> = {
      type: "state-update",
      target: "options",
      payload: {
        stateName,
        state,
      },
    };
    chrome.runtime.sendMessage(message);
  }, [stateName, state]);

  const handleStateUpdateMessage = useCallback(
    ({
      payload: { state, stateName: incomingStateName },
    }: StateUpdateMessage<T>) => {
      if (incomingStateName === stateName) {
        setState(state);
      }
    },
    [stateName, setState]
  );

  const handleMessage = useCallback(
    (
      message: Message,
      _: chrome.runtime.MessageSender,
      sendResponse: () => void
    ): boolean | undefined => {
      if (message.target !== "options") {
        return;
      }
      switch (message.type) {
        case "state-update":
          {
            handleStateUpdateMessage(message);
            sendResponse();
          }
          break;
        default:
          sendResponse();
          break;
      }
      return true;
    },
    [handleStateUpdateMessage]
  );

  useEffect(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [handleMessage]);
}
