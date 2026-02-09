import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: number;
  color?: string;
  side?: "left" | "right" | "top" | "bottom";
}

function DimensionLine({
  start,
  end,
  label,
  offset = 0.06,
  color = "#60a5fa",
  side = "left",
}: DimensionLineProps) {
  const midPoint = useMemo(
    () =>
      [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2,
      ] as [number, number, number],
    [start, end],
  );

  // Main dimension line
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ]);
  }, [start, end]);

  // Extension / tick lines at each end
  const tickSize = 0.012;
  const tickGeometries = useMemo(() => {
    const isVertical = Math.abs(end[1] - start[1]) > Math.abs(end[0] - start[0]);

    const tick1Points = isVertical
      ? [
          new THREE.Vector3(start[0] - tickSize, start[1], start[2]),
          new THREE.Vector3(start[0] + tickSize, start[1], start[2]),
        ]
      : [
          new THREE.Vector3(start[0], start[1] - tickSize, start[2]),
          new THREE.Vector3(start[0], start[1] + tickSize, start[2]),
        ];

    const tick2Points = isVertical
      ? [
          new THREE.Vector3(end[0] - tickSize, end[1], end[2]),
          new THREE.Vector3(end[0] + tickSize, end[1], end[2]),
        ]
      : [
          new THREE.Vector3(end[0], end[1] - tickSize, end[2]),
          new THREE.Vector3(end[0], end[1] + tickSize, end[2]),
        ];

    return {
      tick1: new THREE.BufferGeometry().setFromPoints(tick1Points),
      tick2: new THREE.BufferGeometry().setFromPoints(tick2Points),
    };
  }, [start, end, tickSize]);

  // Arrow head points
  const arrowGeometries = useMemo(() => {
    const isVertical = Math.abs(end[1] - start[1]) > Math.abs(end[0] - start[0]);
    const arrowSize = 0.008;

    if (isVertical) {
      // Arrows pointing up and down
      const arrow1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start[0] - arrowSize, start[1] + arrowSize * 1.5, start[2]),
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(start[0] + arrowSize, start[1] + arrowSize * 1.5, start[2]),
      ]);
      const arrow2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(end[0] - arrowSize, end[1] - arrowSize * 1.5, end[2]),
        new THREE.Vector3(end[0], end[1], end[2]),
        new THREE.Vector3(end[0] + arrowSize, end[1] - arrowSize * 1.5, end[2]),
      ]);
      return { arrow1, arrow2 };
    } else {
      // Arrows pointing left and right
      const arrow1 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start[0] + arrowSize * 1.5, start[1] - arrowSize, start[2]),
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(start[0] + arrowSize * 1.5, start[1] + arrowSize, start[2]),
      ]);
      const arrow2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(end[0] - arrowSize * 1.5, end[1] - arrowSize, end[2]),
        new THREE.Vector3(end[0], end[1], end[2]),
        new THREE.Vector3(end[0] - arrowSize * 1.5, end[1] + arrowSize, end[2]),
      ]);
      return { arrow1, arrow2 };
    }
  }, [start, end]);

  const labelPosition = useMemo((): [number, number, number] => {
    const [mx, my, mz] = midPoint;
    switch (side) {
      case "left":
        return [mx - offset, my, mz];
      case "right":
        return [mx + offset, my, mz];
      case "top":
        return [mx, my + offset, mz];
      case "bottom":
        return [mx, my - offset, mz];
      default:
        return [mx, my, mz];
    }
  }, [midPoint, offset, side]);

  // Pick label style based on color category
  const labelStyle = useMemo(() => {
    // Amber/orange for angled cuts
    if (color === "#f59e0b" || color === "#fbbf24") {
      return {
        bg: "rgba(245, 158, 11, 0.95)",
        text: "#1c1917",
        border: "1px solid rgba(251, 191, 36, 0.6)",
        shadow: "0 2px 8px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(0,0,0,0.1)",
      };
    }
    // Purple for right angled cuts
    if (color === "#8b5cf6" || color === "#a78bfa") {
      return {
        bg: "rgba(139, 92, 246, 0.95)",
        text: "#ffffff",
        border: "1px solid rgba(167, 139, 250, 0.6)",
        shadow: "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(0,0,0,0.1)",
      };
    }
    // Indigo for borders
    if (color === "#6366f1") {
      return {
        bg: "rgba(99, 102, 241, 0.95)",
        text: "#ffffff",
        border: "1px solid rgba(129, 140, 248, 0.6)",
        shadow: "0 2px 8px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(0,0,0,0.1)",
      };
    }
    // Default: bright blue for main dimensions
    return {
      bg: "rgba(15, 23, 42, 0.92)",
      text: "#60a5fa",
      border: "1px solid rgba(96, 165, 250, 0.5)",
      shadow: "0 2px 10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(96, 165, 250, 0.2)",
    };
  }, [color]);

  return (
    <group>
      {/* Main dimension line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </line>

      {/* Tick marks at ends */}
      <line geometry={tickGeometries.tick1}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </line>
      <line geometry={tickGeometries.tick2}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </line>

      {/* Arrow heads */}
      <line geometry={arrowGeometries.arrow1}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </line>
      <line geometry={arrowGeometries.arrow2}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </line>

      {/* Glowing end dots */}
      <mesh position={start}>
        <sphereGeometry args={[0.004, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.004, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Label pill */}
      <Html
        position={labelPosition}
        center
        distanceFactor={0.7}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            backgroundColor: labelStyle.bg,
            padding: "4px 10px",
            borderRadius: "6px",
            border: labelStyle.border,
            boxShadow: labelStyle.shadow,
            fontSize: "13px",
            fontWeight: 700,
            color: labelStyle.text,
            whiteSpace: "nowrap",
            fontFamily:
              "'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            letterSpacing: "0.5px",
            lineHeight: "1.2",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

export function DoorDimensions({ config }: { config: any }) {
  const { showDimensions } = config;

  if (!showDimensions) return null;

  const w = config.width / 1000;
  const h = config.height / 1000;
  const t = (config.thickness || 22) / 1000;

  const dimOffset = 0.10;

  return (
    <group>
      {/* ── HEIGHT — Left side (blue) ── */}
      <DimensionLine
        start={[-w / 2 - dimOffset, -h / 2, 0]}
        end={[-w / 2 - dimOffset, h / 2, 0]}
        label={`${config.height} mm`}
        offset={0.05}
        side="left"
        color="#60a5fa"
      />

      {/* ── WIDTH — Bottom (blue) ── */}
      <DimensionLine
        start={[-w / 2, -h / 2 - dimOffset, 0]}
        end={[w / 2, -h / 2 - dimOffset, 0]}
        label={`${config.width} mm`}
        offset={0.05}
        side="bottom"
        color="#60a5fa"
      />

      {/* ── THICKNESS — Right side, small indicator ── */}
      <DimensionLine
        start={[w / 2 + dimOffset * 0.8, -h / 2, -t / 2]}
        end={[w / 2 + dimOffset * 0.8, -h / 2, t / 2]}
        label={`${config.thickness || 22} mm`}
        offset={0.035}
        side="right"
        color="#60a5fa"
      />

      {/* ── LEFT ANGLED CUT ── */}
      {config.angledLeft && config.leftTriangleCutoutWidth > 0 && (
        <>
          {/* Left Cut Width (amber) */}
          <DimensionLine
            start={[-w / 2, h / 2 + dimOffset * 0.6, 0]}
            end={[
              -w / 2 + config.leftTriangleCutoutWidth / 1000,
              h / 2 + dimOffset * 0.6,
              0,
            ]}
            label={`${config.leftTriangleCutoutWidth} mm`}
            offset={0.035}
            side="top"
            color="#fbbf24"
          />
          {/* Left Cut Height (amber) */}
          <DimensionLine
            start={[-w / 2 - dimOffset * 0.6, h / 2, 0]}
            end={[
              -w / 2 - dimOffset * 0.6,
              h / 2 - config.leftTriangleCutoutHeight / 1000,
              0,
            ]}
            label={`${config.leftTriangleCutoutHeight} mm`}
            offset={0.035}
            side="left"
            color="#fbbf24"
          />
        </>
      )}

      {/* ── RIGHT ANGLED CUT ── */}
      {config.angledRight && config.rightTriangleCutoutWidth > 0 && (
        <>
          {/* Right Cut Width (purple) */}
          <DimensionLine
            start={[
              w / 2 - config.rightTriangleCutoutWidth / 1000,
              h / 2 + dimOffset * 0.6,
              0,
            ]}
            end={[w / 2, h / 2 + dimOffset * 0.6, 0]}
            label={`${config.rightTriangleCutoutWidth} mm`}
            offset={0.035}
            side="top"
            color="#a78bfa"
          />
          {/* Right Cut Height (purple) */}
          <DimensionLine
            start={[w / 2 + dimOffset * 0.6, h / 2, 0]}
            end={[
              w / 2 + dimOffset * 0.6,
              h / 2 - config.rightTriangleCutoutHeight / 1000,
              0,
            ]}
            label={`${config.rightTriangleCutoutHeight} mm`}
            offset={0.035}
            side="right"
            color="#a78bfa"
          />
        </>
      )}

      {/* ── BORDER WIDTHS (when custom borders enabled) ── */}
      {config.customBorders && (
        <>
          {/* Left Stile */}
          <DimensionLine
            start={[-w / 2, 0, t / 2 + dimOffset * 0.5]}
            end={[-w / 2 + config.leftStile / 1000, 0, t / 2 + dimOffset * 0.5]}
            label={`L: ${config.leftStile} mm`}
            offset={0.025}
            side="top"
            color="#6366f1"
          />
          {/* Right Stile */}
          <DimensionLine
            start={[w / 2 - config.rightStile / 1000, 0, t / 2 + dimOffset * 0.5]}
            end={[w / 2, 0, t / 2 + dimOffset * 0.5]}
            label={`R: ${config.rightStile} mm`}
            offset={0.025}
            side="top"
            color="#6366f1"
          />
          {/* Top Rail */}
          <DimensionLine
            start={[0, h / 2 - config.topRail / 1000, t / 2 + dimOffset * 0.5]}
            end={[0, h / 2, t / 2 + dimOffset * 0.5]}
            label={`T: ${config.topRail} mm`}
            offset={0.025}
            side="right"
            color="#6366f1"
          />
          {/* Bottom Rail */}
          <DimensionLine
            start={[0, -h / 2, t / 2 + dimOffset * 0.5]}
            end={[0, -h / 2 + config.bottomRail / 1000, t / 2 + dimOffset * 0.5]}
            label={`B: ${config.bottomRail} mm`}
            offset={0.025}
            side="right"
            color="#6366f1"
          />
        </>
      )}
    </group>
  );
}