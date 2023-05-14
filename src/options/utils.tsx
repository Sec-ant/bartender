import {
  useState,
  useEffect,
  useMemo,
  useRef,
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

  const setStateAndSendMessage = useMessageSyncState(
    stateName,
    state,
    setState
  );

  useEffect(() => {
    if (hasHydrated === true) {
      setStateAndSendMessage(useStore.getState()[stateName]);
    }
  }, [hasHydrated, setStateAndSendMessage, useStore, stateName]);

  return [state, setStateAndSendMessage] as const;
}

function useMessageSyncState<T extends keyof BartenderOptionsState>(
  stateName: T,
  state: BartenderOptionsState[T],
  setState: Dispatch<SetStateAction<BartenderOptionsState[T]>>
) {
  const handleStateUpdateMessage = useCallback(
    async ({
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

  const mark = useRef(false);

  useEffect(() => {
    if (mark.current === false) {
      return;
    }
    mark.current = false;
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

  return useCallback(
    (setStateAction: SetStateAction<BartenderOptionsState[T]>) => {
      setState((prevState) => {
        const currentState =
          typeof setStateAction === "function"
            ? setStateAction(prevState)
            : setStateAction;
        if (currentState !== prevState) {
          mark.current = true;
        }
        return currentState;
      });
    },
    [setState]
  );
}

//-------------------------------------------------------------------

export function useCallbackRef<T, CB extends (() => unknown) | void>(
  rawCallback: (node: T) => CB
) {
  const cleanupRef = useRef<CB | null>(null);
  return useCallback(
    (node: T | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (node) {
        cleanupRef.current = rawCallback(node);
      }
    },
    [rawCallback]
  );
}

export function useStopWheelPropagationCallbackRef<
  T extends HTMLElement = HTMLElement
>() {
  const handleWheel = useCallback((e: WheelEvent) => {
    e.stopPropagation();
  }, []);
  const callbackRef = useCallbackRef(
    useCallback(
      (htmlElement: T) => {
        htmlElement.addEventListener("wheel", handleWheel);
        return () => {
          htmlElement.removeEventListener("wheel", handleWheel);
        };
      },
      [handleWheel]
    )
  );
  return callbackRef;
}
