import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  unit?: string;
}

/**
 * A premium numeric input with:
 * 1. Stepper buttons (±) with hold-to-repeat
 * 2. Free typing when focused
 * 3. Arrow key support
 * 4. Select-all on focus
 * 5. Optional unit label
 * 6. Orange focus glow matching theme
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  className,
  placeholder,
  label,
  unit,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync from store when NOT focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const clamp = useCallback(
    (v: number) => {
      let result = v;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return result;
    },
    [min, max]
  );

  const increment = useCallback(() => {
    const next = clamp(value + step);
    onChange(next);
  }, [value, step, clamp, onChange]);

  const decrement = useCallback(() => {
    const next = clamp(value - step);
    onChange(next);
  }, [value, step, clamp, onChange]);

  const startHold = useCallback(
    (direction: "inc" | "dec") => {
      const fn = direction === "inc" ? increment : decrement;
      fn();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(fn, 75);
      }, 400);
    },
    [increment, decrement]
  );

  const stopHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    // Parse and update store in real-time (for live preview)
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(clamp(parsed));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setTimeout(() => e.target.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localValue);

    if (isNaN(parsed) || localValue.trim() === "") {
      setLocalValue(String(value));
      return;
    }

    const final = clamp(parsed);
    setLocalValue(String(final));
    onChange(final);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(String(value));
      setIsFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      increment();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      decrement();
    }
  };

  const isAtMin = min !== undefined && value <= min;
  const isAtMax = max !== undefined && value >= max;

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border transition-all duration-200",
        "bg-white hover:border-stone-300",
        isFocused
          ? "border-orange-400 ring-2 ring-orange-500/15 shadow-sm"
          : "border-stone-200",
        disabled && "opacity-50 cursor-not-allowed bg-stone-50",
        className
      )}
    >
      {/* Decrement */}
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={() => !disabled && !isAtMin && startHold("dec")}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && !isAtMin && startHold("dec")}
        onTouchEnd={stopHold}
        disabled={disabled || isAtMin}
        className={cn(
          "flex items-center justify-center w-8 h-full shrink-0",
          "text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-l-lg",
          "transition-colors duration-150 active:bg-stone-100",
          (disabled || isAtMin) &&
            "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-stone-400"
        )}
      >
        <Minus className="w-3 h-3" strokeWidth={2.5} />
      </button>

      {/* Input */}
      <div className="flex-1 relative flex items-center justify-center min-w-0">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full text-center text-sm font-semibold tabular-nums",
            "bg-transparent outline-none",
            "text-stone-900 placeholder:text-stone-300",
            "h-9 px-1",
            disabled && "cursor-not-allowed"
          )}
        />
        {unit && !isFocused && (
          <span className="absolute right-1.5 text-[10px] font-medium text-stone-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      {/* Increment */}
      <button
        type="button"
        tabIndex={-1}
        onMouseDown={() => !disabled && !isAtMax && startHold("inc")}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && !isAtMax && startHold("inc")}
        onTouchEnd={stopHold}
        disabled={disabled || isAtMax}
        className={cn(
          "flex items-center justify-center w-8 h-full shrink-0",
          "text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-r-lg",
          "transition-colors duration-150 active:bg-stone-100",
          (disabled || isAtMax) &&
            "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-stone-400"
        )}
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}