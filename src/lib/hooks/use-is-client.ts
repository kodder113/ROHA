"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after hydration on the client; false during server rendering. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
