import {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  Stage,
  OrbitControls,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { Door3D } from "./Door3D";
export interface Door3DHandle {
  resetView: () => void;
}

interface Door3DCanvasProps {
  config: any;
  onPartClick: (section: string) => void;
  rotationEnabled: boolean;
  isMobile: boolean;
}

const Door3DCanvas = forwardRef<Door3DHandle, Door3DCanvasProps>(
  ({ config, onPartClick, rotationEnabled }, ref) => {
    const controlsRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      resetView: () => controlsRef.current?.reset(),
    }));

    return (
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        performance={{ min: 0.5 }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Dark background */}
        <color attach="background" args={["#0c0c0e"]} />

        {/* Soft fog */}
        <fog attach="fog" args={["#0c0c0e", 5, 14]} />

        {/* ── Strong ambient so door is always visible ── */}
        <ambientLight intensity={0.6} color="#e8ddd0" />

        {/* ── Key Light — Bright warm golden from top-right ── */}
        <directionalLight
          position={[4, 8, 5]}
          intensity={2.5}
          color="#ffd6a0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0001}
        />

        {/* ── Fill from front-left — warm white ── */}
        <directionalLight
          position={[-3, 4, 6]}
          intensity={1.5}
          color="#fff5e6"
        />

        {/* ── Rim Light — Cool blue-violet from back-left ── */}
        <spotLight
          position={[-6, 4, -5]}
          angle={0.4}
          penumbra={1}
          intensity={1.5}
          color="#8b7df5"
        />

        {/* ── Side fill — warm amber from right ── */}
        <spotLight
          position={[5, 2, 3]}
          angle={0.6}
          penumbra={1}
          intensity={1.0}
          color="#f5a623"
        />

        {/* ── Top highlight — clean white for material sheen ── */}
        <pointLight position={[0, 6, 2]} intensity={0.8} color="#ffffff" />

        {/* ── Bottom warm uplighting ── */}
        <pointLight position={[0, -2, 3]} intensity={0.4} color="#d4a06a" />

        {/* ── Back accent — purple edge separation ── */}
        <pointLight position={[3, 1, -4]} intensity={0.5} color="#9b7df5" />

        {/* ── Front lower — ensures bottom of door is lit ── */}
        <pointLight position={[0, -1, 4]} intensity={0.5} color="#e8d5c0" />

        {/* Studio environment for reflections */}
        <Environment preset="studio" background={false} />

        <Stage
          intensity={0.15}
          environment="studio"
          adjustCamera={false}
          shadows={{ type: "contact", opacity: 0.7, blur: 2.5 }}
        >
          <Door3D config={config} onPartClick={onPartClick} />
        </Stage>

        {/* Ground contact shadow */}
        <ContactShadows
          position={[0, -0.85, 0]}
          opacity={0.8}
          scale={15}
          blur={2.0}
          far={5}
          color="#000000"
        />

        {/* Subtle ground reflection */}
        <mesh
          position={[0, -0.855, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[8, 8]} />
          <meshPhysicalMaterial
            color="#141418"
            roughness={0.8}
            metalness={0.15}
            transparent
            opacity={0.5}
            envMapIntensity={0.3}
          />
        </mesh>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={rotationEnabled}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 1.4}
          minDistance={0.8}
          maxDistance={4}
          enablePan={false}
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
      </Canvas>
    );
  },
);

Door3DCanvas.displayName = "Door3DCanvas";

export default Door3DCanvas;