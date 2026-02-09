// client/src/components/ui/SyncStatusPanel.tsx
import React from "react";
import { useSyncStatus } from "@/lib/stores/useSyncStatus";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";

interface SyncStatusPanelProps {
  className?: string;
  showInline?: boolean;
}

export function SyncStatusPanel({ className, showInline = false }: SyncStatusPanelProps) {
  const {
    phase,
    progress,
    message,
    errors,
    orderId,
    orderReference,
    reset,
  } = useSyncStatus();

  if (phase === "idle") return null;

  const isLoading = phase === "validating" || phase === "submitting" || phase === "syncing";
  const isComplete = phase === "complete";
  const isError = phase === "error";

  const containerClass = showInline 
    ? "w-full" 
    : "fixed bottom-4 right-4 w-[400px] z-50 shadow-xl";

  return (
    <div className={cn(
      "rounded-lg border-2 overflow-hidden bg-white",
      isComplete && "border-green-300 bg-green-50",
      isError && "border-red-300 bg-red-50",
      isLoading && "border-blue-300 bg-blue-50",
      containerClass,
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3",
        isComplete && "bg-green-100",
        isError && "bg-red-100",
        isLoading && "bg-blue-100"
      )}>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
          {isComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {isError && <XCircle className="h-5 w-5 text-red-600" />}
          
          <span className={cn(
            "font-semibold text-sm",
            isLoading && "text-blue-700",
            isComplete && "text-green-700",
            isError && "text-red-700"
          )}>
            {isComplete ? "Order Created!" : isError ? "Error Occurred" : "Processing..."}
          </span>
        </div>
        
        {(isComplete || isError) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 w-8 p-0 rounded-full hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Progress Bar - only show when loading */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-700">{message}</span>
              <span className="text-blue-600 font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Success State */}
        {isComplete && (
          <div className="space-y-2">
            <p className="text-sm text-green-700">{message}</p>
            {orderId && (
              <div className="bg-white rounded-md p-3 border border-green-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Order ID</span>
                    <p className="font-mono font-semibold text-gray-900">#{orderId}</p>
                  </div>
                  {orderReference && (
                    <div>
                      <span className="text-gray-500 text-xs block">Reference</span>
                      <p className="font-mono font-semibold text-gray-900">{orderReference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {isError && errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <Alert key={index} variant="destructive" className="py-2 bg-white border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">
                  {error.message}
                </AlertTitle>
                {error.field && (
                  <AlertDescription className="text-xs mt-1">
                    Please check the {error.field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.
                  </AlertDescription>
                )}
              </Alert>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}