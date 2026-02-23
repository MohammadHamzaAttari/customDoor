import React, { useState } from "react";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { Door2D } from "@/components/door/Door2D";
import DoorConfigurationPanel from "@/components/builder/DoorConfigurationPanel";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Settings2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "front" | "back";

export default function VisualBuilder() {
    const { doors, activeDoorId, setActiveDoor, addDoor } = useDoorStore();
    const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("front");

    // Auto-seed a door if empty
    React.useEffect(() => {
        if (doors.length === 0) {
            addDoor({ label: "Initial Door" });
        } else if (!activeDoorId && doors.length > 0) {
            setActiveDoor(doors[0].id);
        }
    }, [doors.length, activeDoorId, addDoor, setActiveDoor]);

    const handlePartClick = (part: any) => {
        console.log("Clicked part:", part);
    };

    const config = useDoorConfig();

    if (!config) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4 bg-neutral-100">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-sm font-medium text-neutral-500 animate-pulse">Initializing builder...</p>
            </div>
        );
    }

    if (!doors || doors.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-gray-400 font-medium">
                No doors configured
            </div>
        );
    }

    // This is the 'door' variable that should be used for rendering the active door.
    const door = activeDoorId ? doors.find((d) => d.id === activeDoorId) : doors[0];

    if (!door) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4 bg-neutral-100">
                <p className="text-muted-foreground">Loading your door builder...</p>
            </div>
        );
    }

    return (
        <div className="door-builder-container">
            {/* Viewport Area */}
            <div className="door-builder-canvas">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
                    {(["front", "back"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`
                                px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200
                                ${viewMode === mode
                                    ? mode === "back"
                                        ? "bg-purple-500 text-white shadow-md"
                                        : "bg-blue-500 text-white shadow-md"
                                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                }
                            `}
                        >
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                {mode}
                            </span>
                        </button>
                    ))}
                </div>

                {/* 2D Front/Back View */}
                <Door2D face={viewMode} />

                {/* Mobile Toggle Button */}
                <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <Button
                        onClick={() => setIsMobileConfigOpen(!isMobileConfigOpen)}
                        className="rounded-full shadow-2xl px-6 py-6 h-auto premium-gradient text-white flex items-center gap-2"
                    >
                        <Settings2 className="w-5 h-5" />
                        <span className="font-semibold uppercase text-xs tracking-wider">Configure</span>
                        {isMobileConfigOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Configuration Panel - Right on Desktop, Bottom Sheet on Mobile */}
            <div className="door-builder-config-wrapper">
                {/* Desktop: Always visible */}
                <div className="hidden md:flex h-full">
                    <DoorConfigurationPanel doorId={door.id} />
                </div>

                {/* Mobile: Animated Bottom Sheet */}
                <AnimatePresence>
                    {isMobileConfigOpen && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="md:hidden fixed inset-x-0 bottom-0 z-50 h-[75vh] bg-background rounded-t-3xl shadow-2xl border-t overflow-hidden"
                        >
                            <div className="flex items-center justify-center py-3 border-b bg-muted/30">
                                <div
                                    className="w-12 h-1.5 bg-muted-foreground/30 rounded-full cursor-pointer"
                                    onClick={() => setIsMobileConfigOpen(false)}
                                />
                            </div>
                            <div className="h-[calc(75vh-40px)] overflow-y-auto">
                                <DoorConfigurationPanel doorId={door.id} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
