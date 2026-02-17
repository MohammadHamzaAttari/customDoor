// client/src/components/door/Door3DLazy.tsx
import React, { Suspense, useState, useEffect } from "react";

const Door3DCanvas = React.lazy(() => import("./Door3DCanvas"));

interface Door3DLazyProps {
  config: any;
  onPartClick: (section: string) => void;
  rotationEnabled: boolean;
  isMobile: boolean;
  forceHideLabels?: boolean;
}

export interface Door3DHandle {
  resetView: () => void;
}

function Door3DPlaceholder({ config }: { config: any }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        background: "linear-gradient(135deg, #18181b 0%, #0c0c0e 100%)",
        borderRadius: 8,
      }}
    >
      <svg
        width="160"
        height="260"
        viewBox="0 0 160 260"
        fill="none"
        style={{ opacity: 0.5 }}
      >
        <rect
          x="4"
          y="4"
          width="152"
          height="252"
          rx="2"
          stroke="#3f3f46"
          strokeWidth="2"
          fill="#1c1c1e"
        />
        <rect
          x="20"
          y="20"
          width="120"
          height="220"
          rx="1"
          stroke="#3f3f46"
          strokeWidth="1"
          strokeDasharray="4 2"
          fill="none"
        />
        <text x="80" y="135" textAnchor="middle" fill="#71717a" fontSize="11">
          {config?.width || 0} × {config?.height || 0}
        </text>
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid #3f3f46",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: "#71717a", fontSize: 13 }}>
          Loading 3D view…
        </span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const Door3DLazy = React.forwardRef<Door3DHandle, Door3DLazyProps>(
  ({ config, onPartClick, rotationEnabled, isMobile, forceHideLabels }, ref) => {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
      const hasIdle =
        typeof window !== "undefined" && "requestIdleCallback" in window;
      const timer = hasIdle
        ? (window as any).requestIdleCallback(() => setShouldLoad(true), {
            timeout: 500,
          })
        : setTimeout(() => setShouldLoad(true), 100);

      return () => {
        if (hasIdle) {
          (window as any).cancelIdleCallback(timer);
        } else {
          clearTimeout(timer);
        }
      };
    }, []);

    if (!shouldLoad) {
      return <Door3DPlaceholder config={config} />;
    }

    return (
      <Suspense fallback={<Door3DPlaceholder config={config} />}>
        <Door3DCanvas
          ref={ref}
          config={config}
          onPartClick={onPartClick}
          rotationEnabled={rotationEnabled}
          isMobile={isMobile}
          forceHideLabels={forceHideLabels}
        />
      </Suspense>
    );
  },
);

Door3DLazy.displayName = "Door3DLazy";

export default Door3DLazy;