// client/src/components/ui/FormFieldError.tsx
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <div className={cn("flex items-center gap-1 text-red-500 text-xs mt-1", className)}>
      <AlertCircle className="w-3 h-3" />
      <span>{error}</span>
    </div>
  );
}