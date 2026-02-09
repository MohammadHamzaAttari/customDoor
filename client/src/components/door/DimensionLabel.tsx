// client/src/components/door/DimensionLabel.tsx
import { Html } from "@react-three/drei";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
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
  offset = 0.05,
  color = "#3b82f6",
  side = "left"
}: DimensionLineProps) {
  const midPoint = useMemo(() => [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ] as [number, number, number], [start, end]);

  const linePoints = useMemo(() => {
    const points = [];
    points.push(new THREE.Vector3(...start));
    points.push(new THREE.Vector3(...end));
    return points;
  }, [start, end]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geometry;
  }, [linePoints]);

  // Calculate offset position for label
  const labelPosition = useMemo((): [number, number, number] => {
    const [mx, my, mz] = midPoint;
    switch (side) {
      case "left": return [mx - offset, my, mz];
      case "right": return [mx + offset, my, mz];
      case "top": return [mx, my + offset, mz];
      case "bottom": return [mx, my - offset, mz];
      default: return [mx, my, mz];
    }
  }, [midPoint, offset, side]);

  return (
    <group>
      {/* Dimension Line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>

      {/* End Caps */}
      <mesh position={start}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>


      {/* Label */}
      <Html
        position={labelPosition}
        center
        distanceFactor={0.8}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            padding: '2px 6px',
            borderRadius: '3px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            fontSize: '9px',
            fontWeight: 600,
            color: '#44403c',
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, -apple-system, sans-serif',
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

  // Determine panel thickness based on panelType
  const getPanelThickness = (panelType: string): number => {
    switch (panelType) {
      case "REEDED_19MM": return 19;
      case "MELAMINE_18MM": return 18;
      case "STANDARD_12MM": return 12;
      default: return 0;
    }
  };

  const panelThickness = getPanelThickness(config.panelType);

  // Offsets for dimension lines
  const dimOffset = 0.08;

  return (
    <group>
      {/* Height Dimension (Left side) */}
      <DimensionLine
        start={[-w / 2 - dimOffset, -h / 2, 0]}
        end={[-w / 2 - dimOffset, h / 2, 0]}
        label={`${config.height}mm`}
        offset={0.04}
        side="left"
        color="#3b82f6"
      />

      {/* Width Dimension (Bottom) */}
      <DimensionLine
        start={[-w / 2, -h / 2 - dimOffset, 0]}
        end={[w / 2, -h / 2 - dimOffset, 0]}
        label={`${config.width}mm`}
        offset={0.04}
        side="bottom"
        color="#3b82f6"
      />

      {/* Angled Cut Dimensions */}
      {config.angledLeft && config.leftTriangleCutoutWidth > 0 && (
        <>
          {/* Left Cut Width */}
          <DimensionLine
            start={[-w / 2, h / 2 + dimOffset / 2, 0]}
            end={[-w / 2 + config.leftTriangleCutoutWidth / 1000, h / 2 + dimOffset / 2, 0]}
            label={`${config.leftTriangleCutoutWidth}mm`}
            offset={0.025}
            side="top"
            color="#f59e0b"
          />
          {/* Left Cut Height */}
          <DimensionLine
            start={[-w / 2 - dimOffset / 2, h / 2, 0]}
            end={[-w / 2 - dimOffset / 2, h / 2 - config.leftTriangleCutoutHeight / 1000, 0]}
            label={`${config.leftTriangleCutoutHeight}mm`}
            offset={0.025}
            side="left"
            color="#f59e0b"
          />
        </>
      )}

      {config.angledRight && config.rightTriangleCutoutWidth > 0 && (
        <>
          {/* Right Cut Width */}
          <DimensionLine
            start={[w / 2 - config.rightTriangleCutoutWidth / 1000, h / 2 + dimOffset / 2, 0]}
            end={[w / 2, h / 2 + dimOffset / 2, 0]}
            label={`${config.rightTriangleCutoutWidth}mm`}
            offset={0.025}
            side="top"
            color="#8b5cf6"
          />
          {/* Right Cut Height */}
          <DimensionLine
            start={[w / 2 + dimOffset / 2, h / 2, 0]}
            end={[w / 2 + dimOffset / 2, h / 2 - config.rightTriangleCutoutHeight / 1000, 0]}
            label={`${config.rightTriangleCutoutHeight}mm`}
            offset={0.025}
            side="right"
            color="#8b5cf6"
          />
        </>
      )}

      {/* Border Width Indicators */}
      {config.customBorders && (
        <>
          {/* Left Stile */}
          <DimensionLine
            start={[-w / 2, 0, t / 2 + dimOffset / 2]}
            end={[-w / 2 + config.leftStile / 1000, 0, t / 2 + dimOffset / 2]}
            label={`${config.leftStile}mm`}
            offset={0.02}
            side="top"
            color="#6366f1"
          />
        </>
      )}
    </group>
  );
}