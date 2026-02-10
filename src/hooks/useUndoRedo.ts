import { useState, useCallback, useRef } from 'react';

// Maximum history size to prevent memory issues
const MAX_HISTORY_SIZE = 50;

/**
 * A hook to manage undo/redo history for a generic state object.
 * @param initialState The initial state to start with.
 */
export function useUndoRedo<T>(initialState: T) {
  // Use a ref for history to avoid re-renders on every push,
  // but we still need to trigger re-renders to update availability flags.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // History stack
  const history = useRef<T[]>([initialState]);
  const currentIndex = useRef(0);

  // Current active state
  const [state, setState] = useState<T>(initialState);

  const updateAvailability = useCallback(() => {
    setCanUndo(currentIndex.current > 0);
    setCanRedo(currentIndex.current < history.current.length - 1);
  }, []);

  // Set new state (pushes to history)
  // Added options for replace
  const set = useCallback((newState: T | ((prev: T) => T), options: { replace?: boolean } = {}) => {
    setState((prev) => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev)
        : newState;

      if (nextState === prev) return prev;

      if (options.replace) {
        // Replace current state in history
        history.current[currentIndex.current] = nextState;
      } else {
        // If we are in the middle of history, discard future states
        if (currentIndex.current < history.current.length - 1) {
          history.current = history.current.slice(0, currentIndex.current + 1);
        }

        history.current.push(nextState);
        currentIndex.current = history.current.length - 1;

        // Limit history size
        if (history.current.length > MAX_HISTORY_SIZE) {
          history.current.shift();
          currentIndex.current--;
        }
      }

      updateAvailability();
      return nextState;
    });
  }, [updateAvailability]);

  // Undo action
  const undo = useCallback(() => {
    if (currentIndex.current > 0) {
      currentIndex.current--;
      const prevState = history.current[currentIndex.current];
      setState(prevState);
      updateAvailability();
    }
  }, [updateAvailability]);

  // Redo action
  const redo = useCallback(() => {
    if (currentIndex.current < history.current.length - 1) {
      currentIndex.current++;
      const nextState = history.current[currentIndex.current];
      setState(nextState);
      updateAvailability();
    }
  }, [updateAvailability]);

  // Reset history completely (e.g., on loading new data from DB)
  const reset = useCallback((newState: T) => {
    history.current = [newState];
    currentIndex.current = 0;
    setState(newState);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
}
