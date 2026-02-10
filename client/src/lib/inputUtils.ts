import React from "react";

/**
 * Handles numeric input changes by removing leading zeros and updating the state.
 * @param e The change event from the input field
 * @param setter The state setter function
 */
export const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (n: number) => void
) => {
    let val = e.target.value;

    // Remove leading zeros: e.g., "0345" -> "345", "00" -> "0"
    const sanitized = val.replace(/^0+(?!$)/, "");

    if (val !== sanitized) {
        e.target.value = sanitized;
        val = sanitized;
    }

    const parsed = parseInt(val, 10);
    setter(isNaN(parsed) ? 0 : parsed);
};
