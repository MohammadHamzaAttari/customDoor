// client/src/components/door/DynamicCornerDiagram.tsx
import React from "react";
import { PanelType } from "@/lib/stores/useDoorConfig";

interface DynamicCornerDiagramProps {
    thickness: number;
    rebateWidthMm: number;
    rebateDepthMm: number;
    frontFaceThicknessMm: number;
    cornerRadiusMm: number;
    rearCornerRadiusMm: number;
    panelType: PanelType;
}

export function DynamicCornerDiagram({
    thickness,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    panelType,
}: DynamicCornerDiagramProps) {
    // Scale factor for SVG display (mm to px)
    const scale = 5;
    const padding = 20;

    // Dimensions in pixels
    const t = thickness * scale;
    const rw = rebateWidthMm * scale;
    const rd = rebateDepthMm * scale;
    const ff = frontFaceThicknessMm * scale;
    const cr = cornerRadiusMm * scale;
    const rcr = rearCornerRadiusMm * scale;

    // Viewbox calculation
    const vbWidth = 300;
    const vbHeight = 200;

    // Colors and Styles
    const frameColor = "#f5f5f4";
    const frameStroke = "#57534e";
    const panelColor = "#e7e5e4";
    const panelStroke = "#78716c";
    const highlightColor = "#f97316"; // Orange

    // Render different cross-sections based on panelType
    const renderDiagram = () => {
        switch (panelType) {
            case "NONE": // Slab
                return (
                    <g transform={`translate(${padding}, ${padding})`}>
                        {/* Simple solid block with radii */}
                        <rect
                            x="0" y="0" width={t * 2} height={t} rx={cr} ry={cr}
                            fill={frameColor} stroke={frameStroke} strokeWidth="1.5"
                        />
                        {/* Dimension lines */}
                        <line x1="0" y1={t + 10} x2={t} y2={t + 10} stroke={highlightColor} strokeWidth="1" />
                        <text x={t / 2} y={t + 25} textAnchor="middle" fontSize="10" fill={highlightColor}>{thickness}mm Thickness</text>
                    </g>
                );

            case "REEDED_19MM":
                // Frame with rebate and mating reeded panel (19mm)
                const reededThickness = 19 * scale;
                return (
                    <g transform={`translate(${padding}, ${padding})`}>
                        {/* Frame Part with larger internal corner radius for CNC realism */}
                        <path
                            d={`
                M 0,${t} 
                V ${rcr}
                Q 0,0 ${rcr},0
                H ${t - cr} 
                Q ${t},0 ${t},${cr} 
                V ${ff - rcr} 
                Q ${t},${ff} ${t - rcr},${ff}
                H ${t - rw + rcr}
                Q ${t - rw},${ff} ${t - rw},${ff + rcr}
                V ${t} 
                Z
              `}
                            fill={frameColor} stroke={frameStroke} strokeWidth="1.5"
                        />
                        {/* Mating Reeded Panel - showing the "Tex Flute" profile */}
                        <g transform={`translate(${t - rw + 2}, ${ff})`}>
                            {/* Base of reeded panel */}
                            <path
                                d={`
                  M 0,0 
                  V ${reededThickness} 
                  H ${vbWidth - padding - (t - rw)}
                  V 0
                  H 0
                `}
                                fill={panelColor} stroke={panelStroke} strokeWidth="1"
                            />
                            {/* Reeded texture (vertical lines) */}
                            {[...Array(10)].map((_, i) => (
                                <line key={i} x1={5 + i * 15} y1={2} x2={5 + i * 15} y2={reededThickness - 2} stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
                            ))}
                            <text x="20" y={reededThickness + 15} fontSize="8" fill="#a8a29e" fontWeight="bold">REEDED 19mm</text>
                        </g>

                        {/* Dimension for Reeded thickness */}
                        <line x1={t + 5} y1={ff} x2={t + 5} y2={ff + reededThickness} stroke={highlightColor} strokeWidth="1" />
                        <text x={t + 10} y={ff + reededThickness / 2} dominantBaseline="middle" fontSize="8" fill={highlightColor}>19mm</text>
                    </g>
                );

            case "GLASS":
                return (
                    <g transform={`translate(${padding}, ${padding})`}>
                        {/* Frame with space for glass and retaining piece */}
                        <path
                            d={`
                M 0,${t}
                V ${rcr}
                Q 0,0 ${rcr},0
                H ${t - cr} 
                Q ${t},0 ${t},${cr} 
                V ${ff - rcr}
                Q ${t},${ff} ${t - rcr},${ff}
                H ${t - rw + rcr}
                Q ${t - rw},${ff} ${t - rw},${ff + rcr}
                V ${t} 
                Z
              `}
                            fill={frameColor} stroke={frameStroke} strokeWidth="1.5"
                        />
                        {/* Glass Pane (Thin, translucent) */}
                        <rect x={t - rw + 2} y={ff + 2} width="80" height="15" fill="#bae6fd" opacity="0.4" stroke="#0ea5e9" strokeWidth="0.5" rx="1" />
                        <text x={t - rw + 15} y={ff + 12} fontSize="8" fill="#0369a1" fontWeight="bold">GLASS (4mm)</text>

                        {/* MDF Retaining Piece (as mentioned in PDF) */}
                        <rect x={t - rw + 2} y={ff + 17} width="20" height="15" fill="#d6d3d1" stroke="#444" strokeWidth="0.5" rx="1" />
                        <text x={t - rw + 2} y={ff + 42} fontSize="7" fill="#444">MDF Retainer</text>
                    </g>
                );

            case "FRETWORK":
                return (
                    <g transform={`translate(${padding}, ${padding})`}>
                        {/* Frame */}
                        <path
                            d={`
                M 0,${t}
                V ${rcr}
                Q 0,0 ${rcr},0
                H ${t - cr} 
                Q ${t},0 ${t},${cr} 
                V ${ff - rcr}
                Q ${t},${ff} ${t - rcr},${ff}
                H ${t - rw + rcr}
                Q ${t - rw},${ff} ${t - rw},${ff + rcr}
                V ${t} 
                Z
              `}
                            fill={frameColor} stroke={frameStroke} strokeWidth="1.5"
                        />
                        {/* Fretwork Panel - showing an intricate pattern indicator */}
                        <g transform={`translate(${t - rw + 2}, ${ff + 5})`}>
                            <rect width="80" height="20" fill={panelColor} stroke={panelStroke} strokeWidth="1" />
                            {/* Pattern lines */}
                            <path d="M 0,0 L 20,20 M 20,0 L 0,20 M 20,10 H 40 M 30,0 V 20" stroke="#a8a29e" strokeWidth="0.5" />
                            <text x="10" y="35" fontSize="8" fill={panelStroke} fontWeight="bold">FRETWORK PATTERN</text>
                        </g>
                    </g>
                );

            default: // Shaker (Standard 12/9mm, Melamine 18mm)
                let pt = 12; // default
                if (panelType === "STANDARD_9MM") pt = 9;
                if (panelType === "MELAMINE_18MM") pt = 18;
                const ptx = pt * scale;

                return (
                    <g transform={`translate(${padding}, ${padding})`}>
                        {/* Frame Cross-Section (Top-Right Corner Zoom) */}
                        {/* Path: starts bottom-left, goes up, across top with front corner radius,
                            down to rebate step with inner rebate radius, across rebate, down to bottom */}
                        <path
                            d={`
                M 0,${t}
                V ${rcr}
                Q 0,0 ${rcr},0
                H ${t - cr}
                Q ${t},0 ${t},${cr}
                V ${ff - rcr}
                Q ${t},${ff} ${t - rcr},${ff}
                H ${t - rw + rcr}
                Q ${t - rw},${ff} ${t - rw},${ff + rcr}
                V ${t}
                Z
              `}
                            fill={frameColor} stroke={frameStroke} strokeWidth="1.5"
                            className="drop-shadow-sm"
                        />

                        {/* Panel (in rebate) */}
                        <rect
                            x={t - rw + 2} y={ff + 2} width="80" height={ptx - 4}
                            fill={panelColor} stroke={panelStroke} strokeWidth="1"
                            rx="1"
                        />

                        {/* Labels and dimension lines */}
                        <g className="opacity-70">
                            {/* Thickness */}
                            <line x1={-10} y1={0} x2={-10} y2={t} stroke="#888" strokeWidth="1" />
                            <text x={-15} y={t / 2} transform={`rotate(-90, -15, ${t / 2})`} textAnchor="middle" fontSize="9" fill="#888">{thickness}mm</text>

                            {/* Rebate Depth */}
                            <line x1={t + 5} y1={ff} x2={t + 5} y2={ff + rd} stroke={highlightColor} strokeWidth="1.5" />
                            <text x={t + 10} y={ff + rd / 2} dominantBaseline="middle" fontSize="9" fill={highlightColor} fontWeight="bold">RD: {rebateDepthMm}mm</text>

                            {/* Rebate Width */}
                            <line x1={t - rw} y1={t + 5} x2={t} y2={t + 5} stroke={highlightColor} strokeWidth="1.5" />
                            <text x={t - rw / 2} y={t + 15} textAnchor="middle" fontSize="9" fill={highlightColor} fontWeight="bold">RW: {rebateWidthMm}mm</text>

                            {/* Front Face */}
                            <line x1={t + 5} y1={0} x2={t + 5} y2={ff} stroke="#0ea5e9" strokeWidth="1.5" />
                            <text x={t + 10} y={ff / 2} dominantBaseline="middle" fontSize="9" fill="#0ea5e9" fontWeight="bold">FF: {frontFaceThicknessMm}mm</text>
                        </g>

                        {/* Front Corner Radius Marker (top-right outer) */}
                        <circle cx={t - cr} cy={cr} r={cr} fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2,1" />
                        <text x={t + 2} y={-5} fontSize="8" fill="#16a34a" fontWeight="bold">R{cornerRadiusMm}</text>

                        {/* Inner Rebate Corner Radius Marker */}
                        <circle cx={t - rw + rcr} cy={ff + rcr} r={rcr} fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2,1" />
                        <text x={t - rw - 5} y={ff + rcr * 2 + 12} fontSize="8" fill="#7c3aed" fontWeight="bold" textAnchor="end">R{rearCornerRadiusMm}</text>

                        {/* Rear (Back) Corner Radius Marker (bottom-left) */}
                        <circle cx={rcr} cy={t - rcr} r={rcr} fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2,1" opacity="0.5" />
                    </g>
                );
        }
    };

    return (
        <div className="w-full aspect-[16/9] bg-white rounded-xl border border-stone-200 overflow-hidden relative shadow-inner">
            <svg viewBox={`0 0 ${vbWidth} ${vbHeight}`} className="w-full h-full">
                <defs>
                    <pattern id="gridLarge" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                    </pattern>
                    <pattern id="gridSmall" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5" />
                    </pattern>
                </defs>

                {/* Background Grids */}
                <rect width="100%" height="100%" fill="white" />
                <rect width="100%" height="100%" fill="url(#gridSmall)" />
                <rect width="100%" height="100%" fill="url(#gridLarge)" />

                {/* Legend */}
                <g transform="translate(10, 180)">
                    <text fontSize="8" fill="#888">
                        <tspan x="0" fontWeight="bold" fill={highlightColor}>RW/RD</tspan>: Rebate Width/Depth
                        <tspan x="110" fontWeight="bold" fill="#0ea5e9">FF</tspan>: Front Face
                        <tspan x="180" fontWeight="bold" fill="#16a34a">R</tspan>: Corner Radius
                    </text>
                </g>

                {renderDiagram()}
            </svg>

            {/* Title Overlay */}
            <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-stone-100 shadow-sm">
                <span className="text-[10px] font-bold text-stone-400 tracking-widest uppercase">
                    Dynamic Cross-Section
                </span>
            </div>
        </div>
    );
}
