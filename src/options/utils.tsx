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
  OptionSyncMessage,
  Message,
} from "../common";

/**
 * A hook to use the state of a store.
 * @param {T} stateName - The name of the state to use.
 * @param {UseBatenderOptionsStore} useStore - The store to use.
 * @param {boolean} hasHydrated - Whether the store has been hydrated.
 * @param {number} [wait] - The number of milliseconds to wait before setting the store state.
 * @returns {[BartenderOptionsState[T], Dispatch<SetStateAction<BartenderOptionsState[T]>>]} - An array containing the state and a function to set the state.
 */
export function useStoreState<T extends keyof BartenderOptionsState>(
  stateName: T,
  useStore: UseBatenderOptionsStore,
  hasHydrated: boolean,
  wait?: number
): [
  BartenderOptionsState[T],
  Dispatch<SetStateAction<BartenderOptionsState[T]>>
] {
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

  return [state, setStateAndSendMessage];
}

/**
 * A hook to synchronize state with messages.
 * @param {T} stateName - The name of the state to synchronize.
 * @param {BartenderOptionsState[T]} state - The state to synchronize.
 * @param {Dispatch<SetStateAction<BartenderOptionsState[T]>>} setState - A function to set the state.
 * @returns {Dispatch<SetStateAction<BartenderOptionsState[T]>>} - A function to set the state and send a message.
 */
function useMessageSyncState<T extends keyof BartenderOptionsState>(
  stateName: T,
  state: BartenderOptionsState[T],
  setState: Dispatch<SetStateAction<BartenderOptionsState[T]>>
): Dispatch<SetStateAction<BartenderOptionsState[T]>> {
  const handleOptionSyncMessage = useCallback(
    async ({
      payload: { state, stateName: incomingStateName },
    }: OptionSyncMessage<T>) => {
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
        case "option-sync":
          {
            handleOptionSyncMessage(message);
            sendResponse();
          }
          break;
        default:
          sendResponse();
          break;
      }
      return true;
    },
    [handleOptionSyncMessage]
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
    const message: OptionSyncMessage<T> = {
      type: "option-sync",
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

/**
 * A hook to create a callback ref.
 * @param {(node: T) => CB} rawCallback - A function that takes a node and returns a callback.
 * @returns {(node: T | null) => void} - A callback ref that takes a node or null.
 */
export function useCallbackRef<T, CB extends (() => unknown) | void>(
  rawCallback: (node: T) => CB
): (node: T | null) => void {
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

/**
 * A hook to create a callback ref that stops wheel event propagation.
 * @returns {(node: T | null) => void} - A callback ref that takes an HTMLElement or null.
 */
export function useStopWheelPropagationCallbackRef<
  T extends HTMLElement = HTMLElement
>(): (node: T | null) => void {
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
