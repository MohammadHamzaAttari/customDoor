import React from "react";

/**
 * Handles numeric input changes with debounced validation.
 * Allows free typing without immediate reversion.
 */
export const handleNumberChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (n: number) => void
) => {
  const val = e.target.value;

  // Allow empty field while typing (don't force to 0)
  if (val === "" || val === "-") {
    return;
  }

  // Remove leading zeros but allow the value
  const sanitized = val.replace(/^0+(?=\d)/, "");

  const parsed = parseFloat(sanitized);
  if (!isNaN(parsed)) {
    setter(parsed);
  }
};

/**
 * Handle blur event to enforce minimum values and clean up
 */
export const handleNumberBlur = (
  e: React.FocusEvent<HTMLInputElement>,
  setter: (n: number) => void,
  min?: number,
  fallback?: number
) => {
  const val = e.target.value;
  const parsed = parseFloat(val);

  if (isNaN(parsed) || val === "") {
    // Restore to fallback or min
    const restoreValue = fallback ?? min ?? 0;
    setter(restoreValue);
    e.target.value = String(restoreValue);
    return;
  }

  if (min !== undefined && parsed < min) {
    setter(min);
    e.target.value = String(min);
    return;
  }

  setter(parsed);
};

/**
 * Focus handler - select all text for easy overwriting
 */
export const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};