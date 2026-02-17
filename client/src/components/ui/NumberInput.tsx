import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * A controlled numeric input that:
 * 1. Shows the store value when not focused
 * 2. Allows free typing when focused (no immediate reversion)
 * 3. Validates and commits on blur
 * 4. Selects all text on focus for easy overwriting
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  disabled = false,
  className,
  placeholder,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from store when NOT focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    // Parse and update store in real-time (for live preview)
    // but don't force the input display
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
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
      // Restore to current store value
      setLocalValue(String(value));
      return;
    }

    let finalValue = parsed;

    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }

    setLocalValue(String(finalValue));
    onChange(finalValue);
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
  };

  return (
    <Input
      ref={inputRef}
      type="number"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}