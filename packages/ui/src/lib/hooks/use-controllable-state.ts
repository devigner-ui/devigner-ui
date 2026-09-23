"use client";

import * as React from "react";

export type ControllableStateUpdater<T> = T | ((previous: T) => T);

export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onValueChange?: (value: T) => void;
}

/** Keeps a component responsive when uncontrolled without competing with a
 *  caller-provided value when controlled. */
export function useControllableState<T>({
  value,
  defaultValue,
  onValueChange,
}: UseControllableStateOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const currentValueRef = React.useRef(currentValue);
  const onValueChangeRef = React.useRef(onValueChange);

  currentValueRef.current = currentValue;
  onValueChangeRef.current = onValueChange;

  const setValue = React.useCallback(
    (next: ControllableStateUpdater<T>) => {
      const previousValue = currentValueRef.current;
      const nextValue =
        typeof next === "function"
          ? (next as (previous: T) => T)(previousValue)
          : next;

      if (Object.is(previousValue, nextValue)) return;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChangeRef.current?.(nextValue);
    },
    [isControlled],
  );

  return [currentValue, setValue] as const;
}
