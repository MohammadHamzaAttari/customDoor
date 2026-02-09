import React, { Suspense, useState, useEffect } from "react";

// Lazy load the ENTIRE 3D canvas - Three.js won't download until this mounts
const Door3DCanvas = React.lazy(() => import("./Door3DCanvas"));

interface Door3DLazyProps {
  config: any;
  onPartClick: (section: string) => void;
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
        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        borderRadius: 8,
      }}
    >
      {/* Simple 2D door outline as placeholder */}
      <svg
        width="160"
        height="260"
        viewBox="0 0 160 260"
        fill="none"
        style={{ opacity: 0.6 }}
      >
        <rect
          x="4"
          y="4"
          width="152"
          height="252"
          rx="2"
          stroke="#94a3b8"
          strokeWidth="2"
          fill="#f8fafc"
        />
        <rect
          x="20"
          y="20"
          width="120"
          height="220"
          rx="1"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="4 2"
          fill="none"
        />
        <text x="80" y="135" textAnchor="middle" fill="#94a3b8" fontSize="11">
          {config.width} × {config.height}
        </text>
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid #cbd5e1",
            borderTopColor: "#3b82f6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: "#64748b", fontSize: 13 }}>
          Loading 3D view...
        </span>
      </div>
    </div>
  );
}

export default function Door3DLazy({ config, onPartClick }: Door3DLazyProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Delay 3D loading slightly so the UI shell paints first
    const timer = requestIdleCallback
      ? requestIdleCallback(() => setShouldLoad(true), { timeout: 500 })
      : setTimeout(() => setShouldLoad(true), 100);

    return () => {
      if (requestIdleCallback) {
        cancelIdleCallback(timer as number);
      } else {
        clearTimeout(timer as any);
      }
    };
  }, []);

  if (!shouldLoad) {
    return <Door3DPlaceholder config={config} />;
  }

  return (
    <Suspense fallback={<Door3DPlaceholder config={config} />}>
      <Door3DCanvas config={config} onPartClick={onPartClick} />
    </Suspense>
  );
}