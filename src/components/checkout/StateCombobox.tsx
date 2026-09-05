"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchState, suggestStates } from "@/lib/indianStates";

/**
 * Type-to-filter state picker.
 *
 * A plain <select> of thirty-six entries is a long scroll on a phone, and a
 * free-text box is how "Maharastra" reaches a courier. This is the middle:
 * type two letters, pick from what is left. It stays an <input>, so browser
 * autofill still fills it and the value is never trapped behind a widget.
 *
 * Whatever is typed resolves to the canonical spelling on the way out — "MH",
 * "orissa" and "jammu & kashmir" are not distinctions worth shipping onward.
 */
export function StateCombobox({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  className,
  placeholder = "Start typing, e.g. Maha",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  /**
   * Passed in rather than imported: GuestAddressFields owns the form's
   * placeholder tone and already imports this component, so reaching back for
   * it would close an import cycle.
   */
  className?: string;
  placeholder?: string;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const options = suggestStates(value);

  // A click anywhere else is a dismissal. Pointerdown rather than click so the
  // list is gone before the next element takes focus.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(state: string) {
    onChange(state);
    setOpen(false);
    setHighlighted(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted((current) => {
        if (options.length === 0) return 0;
        return (current + step + options.length) % options.length;
      });
      return;
    }
    if (event.key === "Enter" && open && options[highlighted]) {
      // Only swallow Enter when it is choosing something; otherwise let it
      // submit the form as it would anywhere else.
      event.preventDefault();
      commit(options[highlighted]);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  /**
   * Focus handling lives on the wrapper, not the input.
   *
   * The Input is Base UI's, which manages its own focus and does not pass an
   * onFocus/onBlur through to us — so handlers placed on it silently never
   * ran. React's onFocus/onBlur are focusin/focusout underneath, which do
   * bubble, so the container sees them either way.
   */
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Moving between the input and its own list is not leaving the field.
    if (containerRef.current?.contains(event.relatedTarget)) return;
    setOpen(false);
    // Snap to the canonical spelling if what they typed resolves to one.
    // Anything else is left alone for validation to report, rather than being
    // silently replaced with a state they did not choose.
    const resolved = matchState(value);
    if (resolved && resolved !== value) onChange(resolved);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
    >
      <Input
        id={id}
        type="text"
        role="combobox"
        autoComplete="address-level1"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[highlighted] ? `${listId}-${highlighted}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        className={cn("pr-9", className)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
      />

      <ChevronDown
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      />

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-background py-1 shadow-lg"
        >
          {options.map((state, index) => {
            const isHighlighted = index === highlighted;
            const isSelected = matchState(value) === state;
            return (
              <li
                key={state}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(index)}
                // Pointerdown, not click: the input's blur would otherwise
                // close the list before a click ever landed.
                onPointerDown={(event) => {
                  event.preventDefault();
                  commit(state);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
                  isHighlighted && "bg-rose-50 dark:bg-rose-950/30"
                )}
              >
                <span>{state}</span>
                {isSelected && <Check className="size-4 shrink-0 text-rose-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
