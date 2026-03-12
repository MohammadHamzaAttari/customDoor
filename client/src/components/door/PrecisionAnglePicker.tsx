// client/src/components/door/PrecisionAnglePicker.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/ui/NumberInput";

interface PrecisionAnglePickerProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
    className?: string;
}

/**
 * PrecisionAnglePicker - A premium interactive UI for selecting angles.
 * Features a radial dial with smooth drag-to-sweep and high-precision numeric input.
 */
export function PrecisionAnglePicker({
    value,
    onChange,
    min = 15,
    max = 60,
    label,
    className,
}: PrecisionAnglePickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Angle constraints and SVG geometry
    const radius = 80;
    const strokeWidth = 12;
    const center = 100;

    // Map angle (min-max) to SVG rotation (startAngle to endAngle)
    // We'll use a semi-circle from roughly -120deg to -60deg (relative to top)
    // Or simpler: map min-max directly to a visually pleasing arc
    const startRad = (210 * Math.PI) / 180; // Starts bottom-leftish
    const endRad = (330 * Math.PI) / 180;   // Ends bottom-rightish

    const getAngleFromPos = useCallback((x: number, y: number) => {
        if (!containerRef.current) return value;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Calculate angle in radians from center
        const dx = x - cx;
        const dy = y - cy;
        let rad = Math.atan2(dy, dx);

        // Normalize to 0-2PI
        if (rad < 0) rad += 2 * Math.PI;

        // Map rad to angle value (min-max)
        // The arc is from 210deg to 330deg (bottom-left to bottom-right)
        // We want to normalize the radial sweep to a 0-1 range
        let normalized = (rad - startRad) / (endRad - startRad);

        // Handle wrap or out-of-bounds
        if (normalized < 0) normalized = 0;
        if (normalized > 1) normalized = 1;

        const newVal = min + normalized * (max - min);
        return newVal;
    }, [min, max, startRad, endRad, value]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const val = getAngleFromPos(clientX, clientY);
        onChange(parseFloat(val.toFixed(2)));
    };

    useEffect(() => {
        if (!isDragging) return;

        const onMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            const val = getAngleFromPos(clientX, clientY);
            onChange(parseFloat(val.toFixed(2)));
        };

        const onEnd = () => setIsDragging(false);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchmove", onMove);
        window.addEventListener("touchend", onEnd);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onEnd);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
        };
    }, [isDragging, getAngleFromPos, onChange]);

    // Calculate handle position
    const normalizedValue = (value - min) / (max - min);
    const currentRad = startRad + normalizedValue * (endRad - startRad);
    const hx = center + radius * Math.cos(currentRad);
    const hy = center + radius * Math.sin(currentRad);

    // SVG Path for the arc
    const arcPath = `M ${center + radius * Math.cos(startRad)} ${center + radius * Math.sin(startRad)} 
                   A ${radius} ${radius} 0 0 1 ${center + radius * Math.cos(endRad)} ${center + radius * Math.sin(endRad)}`;

    return (
        <div className={cn("flex flex-col items-center gap-2 select-none", className)}>
            {label && <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</label>}

            <div
                ref={containerRef}
                className="relative w-[200px] h-[140px] flex items-center justify-center cursor-crosshair"
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Background Arc */}
                    <path
                        d={arcPath}
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Active Progress Arc */}
                    <motion.path
                        d={arcPath}
                        fill="none"
                        stroke="url(#angleGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: normalizedValue }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />

                    <defs>
                        <linearGradient id="angleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f97316" /> {/* Orange-500 */}
                            <stop offset="100%" stopColor="#ef4444" /> {/* Red-500 */}
                        </linearGradient>
                        <filter id="handleShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="0" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Markers */}
                    {[15, 30, 45, 60].map((m) => {
                        const mNorm = (m - min) / (max - min);
                        const mRad = startRad + mNorm * (endRad - startRad);
                        const mx1 = center + (radius - 12) * Math.cos(mRad);
                        const my1 = center + (radius - 12) * Math.sin(mRad);
                        const mx2 = center + (radius + 12) * Math.cos(mRad);
                        const my2 = center + (radius + 12) * Math.sin(mRad);
                        const isExact = Math.abs(value - m) < 0.5;

                        return (
                            <g key={m}>
                                <line
                                    x1={mx1} y1={my1} x2={mx2} y2={my2}
                                    stroke={isExact ? "#f97316" : "#e5e7eb"}
                                    strokeWidth={2}
                                    className="transition-colors duration-200"
                                />
                                <text
                                    x={center + (radius + 28) * Math.cos(mRad)}
                                    y={center + (radius + 28) * Math.sin(mRad)}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={cn(
                                        "text-[10px] font-bold transition-all duration-200",
                                        isExact ? "fill-orange-600 scale-110" : "fill-stone-300"
                                    )}
                                >
                                    {m}°
                                </text>
                            </g>
                        );
                    })}

                    {/* Drag Handle */}
                    <motion.circle
                        cx={hx}
                        cy={hy}
                        r={10}
                        fill="white"
                        stroke="#f97316"
                        strokeWidth={3}
                        filter="url(#handleShadow)"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ cursor: "grab" }}
                    />
                </svg>

                {/* Central Readout */}
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                    <div className="bg-stone-50 border border-stone-100 rounded-full px-4 py-1.5 shadow-inner">
                        <span className="text-2xl font-black text-stone-800 tracking-tight leading-none">
                            {value.toFixed(2)}
                            <span className="text-sm font-medium text-stone-400 ml-0.5">°</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-32 mt-2">
                <NumberInput
                    value={value}
                    onChange={(v) => onChange(parseFloat(v.toFixed(2)))}
                    min={min}
                    max={max}
                    step={0.01}
                    unit="°"
                />
            </div>
        </div>
    );
}
