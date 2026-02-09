// client/src/pages/DoorConfigurator.tsx
import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Door3D } from "@/components/door/Door3D";
import { ConfigSidebar } from "@/components/door/ConfigSidebar";
import { ProductDetailsSidebar } from "@/components/door/ProductDetailsSidebar";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Settings2, RotateCcw, Move3d } from "lucide-react";
import { useState, useRef } from "react";

export default function DoorConfigurator() {
  const isMobile = useIsMobile();
  const config = useDoorConfig();
  const { price, setSelectedSection } = config;
  const controlsRef = useRef<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(!isMobile);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full min-h-screen bg-gray-100 overflow-x-hidden overflow-y-auto">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white z-20 shadow-sm shrink-0">
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Trade Shaker</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Custom Door Designer</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 font-medium block">Total Price:</span>
            <span className="text-lg font-bold text-emerald-600">£{price.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <div className="h-full w-[380px] shadow-xl z-20 relative shrink-0 bg-white">
          <ConfigSidebar isMobile={false} />
        </div>
      )}

      {/* Main 3D Viewer */}
      <div className="flex-1 relative bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100 overflow-hidden">
        {/* 3D Canvas */}
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0, 2.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#fafaf9"]} />

          {/* Lighting Setup */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.0}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <spotLight
            position={[-5, 5, -5]}
            angle={0.3}
            penumbra={1}
            intensity={0.6}
            color="#fff7ed"
          />
          <pointLight position={[0, -2, 2]} intensity={0.3} color="#fff7ed" />

          <Environment preset="apartment" background={false} />

          <Stage
            intensity={0.2}
            environment="apartment"
            adjustCamera={false}
            shadows={{ type: 'contact', opacity: 0.5, blur: 2.5 }}
          >
            <Door3D
              config={config}
              onPartClick={(section) => setSelectedSection(section)}
            />
          </Stage>

          <ContactShadows
            position={[0, -0.85, 0]}
            opacity={0.7}
            scale={15}
            blur={2.5}
            far={5}
            color="#2a1a1a"
          />

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

        {/* View Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleResetView}
            className="bg-white/90 backdrop-blur-sm shadow-md hover:bg-white text-stone-700"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          {/* Mobile Rotation Toggle */}
          {isMobile && (
            <Button
              variant={rotationEnabled ? "default" : "secondary"}
              size="icon"
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className={rotationEnabled
                ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                : "bg-white/90 backdrop-blur-sm shadow-md hover:bg-white text-stone-700"
              }
              title={rotationEnabled ? "Disable 3D Rotation" : "Enable 3D Rotation"}
            >
              <Move3d className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Branding Watermark */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-stone-100">
            <p className="text-xs font-bold text-stone-800">Freebird Trade</p>
            <p className="text-[10px] text-stone-500">Premium Door Manufacturer</p>
          </div>
        </div>

        {/* Interaction Hints */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
          <div className="bg-stone-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
            <p className="text-[10px] opacity-90 font-medium">
              {isMobile
                ? (rotationEnabled ? "🔄 Rotation ON • Tap button to scroll" : "📜 Scroll enabled • Tap 3D button to rotate")
                : "🖱️ Drag to rotate • Scroll to zoom"
              }
            </p>
          </div>
        </div>

        {/* Mobile Bottom Sheet Trigger */}
        {isMobile && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  className="rounded-full shadow-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 px-6 py-6 h-auto flex items-center gap-2 group border-2 border-white/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Settings2 className="w-5 h-5" />
                  <span className="font-bold uppercase text-xs tracking-wider">Configure Door</span>
                  <ChevronUp className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] px-0 pb-0 rounded-t-3xl border-t-0 shadow-2xl"
              >
                <div className="h-full overflow-y-auto pt-2 bg-white">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                  <div className="px-4 pb-20">
                    <ConfigSidebar isMobile={true} onClose={() => setIsSheetOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* Desktop Right Sidebar */}
      {!isMobile && (
        <div className="h-full w-[340px] shadow-xl z-20 relative shrink-0 bg-white">
          <ProductDetailsSidebar />
        </div>
      )}
    </div>
  );
}