"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

/**
 * Backs a quantity stepper with locally-optimistic state: +/- clicks update
 * the number on screen immediately, while the actual commit (e.g. a cart
 * update API call) is debounced so rapid clicks coalesce into a single
 * request instead of firing one per click.
 */
export function useDebouncedQuantity(
  serverQuantity: number,
  onCommit: (quantity: number) => void,
  delayMs = 450
) {
  const [quantity, setQuantity] = useState(serverQuantity);

  // Resync whenever the source of truth changes — covers the mutation we
  // just committed landing, as well as external changes (variant switch,
  // cart merge, removal elsewhere).
  useEffect(() => {
    setQuantity(serverQuantity);
  }, [serverQuantity]);

  const debouncedCommit = useDebouncedCallback(onCommit, delayMs);

  function change(newQuantity: number) {
    setQuantity(newQuantity);
    debouncedCommit(newQuantity);
  }

  return { quantity, change };
}
