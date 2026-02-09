// client/src/components/ui/ValidatedInput.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  touched?: boolean;
  showValidIcon?: boolean;
}

export function ValidatedInput({
  label,
  error,
  hint,
  touched = false,
  showValidIcon = false,
  className,
  id,
  required,
  ...props
}: ValidatedInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  const hasError = touched && !!error;
  const isValid = touched && !error && props.value;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium",
          hasError ? "text-red-600" : "text-gray-700"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={inputId}
          className={cn(
            "transition-colors duration-200",
            hasError && "border-red-500 focus-visible:ring-red-500 bg-red-50/50 pr-10",
            isValid && showValidIcon && "border-green-500 pr-10",
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
        
        {isValid && showValidIcon && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {hint && !hasError && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      
      {hasError && (
        <p 
          id={`${inputId}-error`}
          className="text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}