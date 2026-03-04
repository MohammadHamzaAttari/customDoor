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

/**
 * Professional CNC cross-section diagram showing the door frame corner profile.
 * Clear L-shaped rebate geometry matching the physical door reference image.
 */
export function DynamicCornerDiagram({
    thickness,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    panelType,
}: DynamicCornerDiagramProps) {
    if (panelType === "NONE") {
        return (
            <div className="w-full bg-stone-50 rounded-xl border border-stone-200 overflow-hidden p-4">
                <div className="text-center text-xs text-stone-400 italic">
                    Slab door — no rebate cross-section
                </div>
            </div>
        );
    }

    // ── Layout Constants ────────────────────────────────────────
    const s = 7;           // pixels per mm — large enough to be clear
    const pad = 50;        // padding around shape for labels

    // Geometry in pixels
    const T = thickness * s;
    const RW = rebateWidthMm * s;
    const FF = frontFaceThicknessMm * s;
    const RD = rebateDepthMm * s;
    const CR = Math.min(cornerRadiusMm * s, RD * 0.8, T * 0.3);
    const RCR = Math.min(rearCornerRadiusMm * s, RW * 0.6, (T - RD) * 0.3);

    // The L-shaped frame profile
    // Horizontal = door thickness (REAR on left, FRONT on right)
    // Vertical = stile width (exaggerated for clarity)
    const shapeW = T;
    const shapeH = Math.round(T * 1.5);   // vertical extent of visible stile section
    const stepY = RD;                        // rebate step position from top (REAR)

    // Origin of shape
    const ox = pad;
    const oy = pad - 10;

    // ViewBox sized to fit everything with margins for dimension text
    const vbW = ox + shapeW + pad + 50;
    const vbH = oy + shapeH + pad + 10;

    // ── Frame path with rounded corners ─────────────────────────
    const path = `
        M ${ox},${oy + shapeH}
        V ${oy}
        H ${ox + shapeW - CR}
        Q ${ox + shapeW},${oy} ${ox + shapeW},${oy + CR}
        V ${oy + stepY - RCR}
        Q ${ox + shapeW},${oy + stepY} ${ox + shapeW - RCR},${oy + stepY}
        H ${ox + shapeW - RW + RCR}
        Q ${ox + shapeW - RW},${oy + stepY} ${ox + shapeW - RW},${oy + stepY + RCR}
        V ${oy + shapeH}
        Z
    `;

    // ── Colors & Styling ───────────────────────────────────────
    const isMDFModel = panelType === "MELAMINE_18MM";

    const frameCol = isMDFModel ? "#d7ccc8" : "#f5f5f4"; // MDF tan or neutral off-white
    const frameStk = isMDFModel ? "#5d4037" : "#57534e"; // MDF brown or neutral dark
    const panelCol = isMDFModel ? "#c19a6b" : "#e7e5e4"; // MDF raw brown or light gray
    const blue = isMDFModel ? "#1e40af" : "#0284c7"; // Blue accent adjustment
    const orange = "#ea580c";
    const green = "#16a34a";
    const purple = "#7c3aed";
    const gray = frameStk;
    const tk = 4; // tick half-length

    // Panel geometry - REMOVED GAPS for exact CNC representation
    let panelMm = 12;
    if (panelType === "STANDARD_9MM") panelMm = 9;
    if (panelType === "MELAMINE_18MM") panelMm = 18;
    if (panelType === "REEDED_19MM") panelMm = 19;

    const panelPx = panelMm * s;
    const pX = ox + shapeW - RW; // NO OFFSET (tight to rebate edge)
    const pY = oy + stepY;      // NO OFFSET (tight to rebate depth)
    const pW = RW + 35;
    const pH = Math.min(panelPx, shapeH - stepY); // NO GAP

    return (
        <div className="w-full bg-white rounded-xl border border-stone-200 overflow-hidden relative">
            <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full" style={{ minHeight: 200 }}>
                {/* Grid background */}
                <defs>
                    <pattern id="csg" width="14" height="14" patternUnits="userSpaceOnUse">
                        <path d="M 14 0 L 0 0 0 14" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="white" />
                <rect width="100%" height="100%" fill="url(#csg)" />

                {/* ═══ FRAME SHAPE ═══ */}
                <path d={path} fill={frameCol} stroke={frameStk} strokeWidth="1.8" />

                {/* ═══ PANEL ═══ */}
                <rect x={pX} y={pY} width={pW} height={pH}
                    fill={panelCol} stroke="#a8a29e" strokeWidth="0.5"
                />
                {panelType === "REEDED_19MM" && [...Array(Math.min(6, Math.floor(pW / 10)))].map((_, i) => (
                    <line key={i}
                        x1={pX + 8 + i * 9} y1={pY + 3}
                        x2={pX + 8 + i * 9} y2={pY + pH - 3}
                        stroke="#b5ada2" strokeWidth="1.3" strokeLinecap="round"
                    />
                ))}

                {/* Panel label */}
                <text x={pX + 18} y={pY + pH / 2 + 3}
                    textAnchor="start" fontSize="8" fill="#78716c" fontWeight="700" fontStyle="italic">
                    {panelType === "REEDED_19MM" ? `${panelMm}mm Reeded` :
                        panelType === "MELAMINE_18MM" ? `${panelMm}mm Melamine` :
                            panelType === "FRETWORK" ? "Fretwork" : `${panelMm}mm Panel`}
                </text>

                {/* ═══ DIRECTION LABELS ═══ */}
                <text x={ox + shapeW + 6} y={oy - 6} fontSize="9" fill="#78716c" fontWeight="800" letterSpacing="1.5">
                    REAR ▸
                </text>
                <text x={ox - 6} y={oy - 6} fontSize="9" fill="#78716c" fontWeight="800" letterSpacing="1.5" textAnchor="end">
                    ◂ FRONT
                </text>

                {/* ═══ DIM: Total Thickness (left side, vertical) ═══ */}
                {(() => {
                    const dx = ox - 18;
                    return (
                        <g>
                            <line x1={dx} y1={oy} x2={dx} y2={oy + T} stroke={gray} strokeWidth="1" />
                            <line x1={dx - tk} y1={oy} x2={dx + tk} y2={oy} stroke={gray} strokeWidth="1" />
                            <line x1={dx - tk} y1={oy + T} x2={dx + tk} y2={oy + T} stroke={gray} strokeWidth="1" />
                            <text x={dx - 3} y={oy + T / 2}
                                transform={`rotate(-90, ${dx - 3}, ${oy + T / 2})`}
                                textAnchor="middle" fontSize="10" fill={gray} fontWeight="700">
                                {thickness}mm
                            </text>
                        </g>
                    );
                })()}

                {/* ═══ DIM: Rebate Depth (right side, top segment) ═══ */}
                {(() => {
                    const dx = ox + shapeW + 16;
                    const y1 = oy;
                    const y2 = oy + RD;
                    return (
                        <g>
                            <line x1={dx} y1={y1} x2={dx} y2={y2} stroke={orange} strokeWidth="1.3" />
                            <line x1={dx - tk} y1={y1} x2={dx + tk} y2={y1} stroke={orange} strokeWidth="1" />
                            <line x1={dx - tk} y1={y2} x2={dx + tk} y2={y2} stroke={orange} strokeWidth="1" />
                            {/* extensions */}
                            <line x1={ox + shapeW + 2} y1={y1} x2={dx + tk} y2={y1} stroke={orange} strokeWidth="0.3" strokeDasharray="2,2" />
                            <line x1={ox + shapeW + 2} y1={y2} x2={dx + tk} y2={y2} stroke={orange} strokeWidth="0.3" strokeDasharray="2,2" />
                            <text x={dx + 8} y={(y1 + y2) / 2 + 4} fontSize="10" fill={orange} fontWeight="700">
                                {rebateDepthMm}mm
                            </text>
                        </g>
                    );
                })()}

                {/* ═══ DIM: Front Face (right side, bottom segment) ═══ */}
                {(() => {
                    const dx = ox + shapeW + 16;
                    const y1 = oy + RD;
                    const y2 = oy + T;
                    return (
                        <g>
                            <line x1={dx} y1={y1} x2={dx} y2={y2} stroke={blue} strokeWidth="1.3" />
                            <line x1={dx - tk} y1={y2} x2={dx + tk} y2={y2} stroke={blue} strokeWidth="1" />
                            <text x={dx + 8} y={(y1 + y2) / 2 + 4} fontSize="10" fill={blue} fontWeight="700">
                                {frontFaceThicknessMm}mm
                            </text>
                        </g>
                    );
                })()}

                {/* ═══ DIM: Rebate Width (bottom, horizontal) ═══ */}
                {(() => {
                    const dy = oy + shapeH + 14;
                    const x1 = ox + shapeW - RW;
                    const x2 = ox + shapeW;
                    return (
                        <g>
                            <line x1={x1} y1={dy} x2={x2} y2={dy} stroke={orange} strokeWidth="1.3" />
                            <line x1={x1} y1={dy - tk} x2={x1} y2={dy + tk} stroke={orange} strokeWidth="1" />
                            <line x1={x2} y1={dy - tk} x2={x2} y2={dy + tk} stroke={orange} strokeWidth="1" />
                            {/* extensions */}
                            <line x1={x1} y1={oy + shapeH + 2} x2={x1} y2={dy + tk} stroke={orange} strokeWidth="0.3" strokeDasharray="2,2" />
                            <line x1={x2} y1={oy + stepY + 2} x2={x2} y2={dy + tk} stroke={orange} strokeWidth="0.3" strokeDasharray="2,2" />
                            <text x={(x1 + x2) / 2} y={dy + 14} textAnchor="middle" fontSize="10" fill={orange} fontWeight="700">
                                {rebateWidthMm}mm
                            </text>
                        </g>
                    );
                })()}

                {/* ═══ CORNER: Front outer (top-right) ═══ */}
                {CR > 2 && (
                    <g>
                        <path
                            d={`M ${ox + shapeW - CR},${oy}
                                A ${CR},${CR} 0 0,1 ${ox + shapeW},${oy + CR}`}
                            fill="none" stroke={green} strokeWidth="2" strokeDasharray="3,2"
                        />
                        <line x1={ox + shapeW - CR * 0.3} y1={oy + CR * 0.3}
                            x2={ox + shapeW + 20} y2={oy + CR + 8}
                            stroke={green} strokeWidth="0.6" />
                        <circle cx={ox + shapeW - CR * 0.3} cy={oy + CR * 0.3} r="2" fill={green} />
                        <text x={ox + shapeW + 22} y={oy + CR + 12} fontSize="10" fill={green} fontWeight="800">
                            R{cornerRadiusMm}
                        </text>
                    </g>
                )}

                {/* ═══ CORNER: Inner rebate step ═══ */}
                {RCR > 2 && (
                    <g>
                        <path
                            d={`M ${ox + shapeW - RW},${oy + stepY + RCR}
                                A ${RCR},${RCR} 0 0,1 ${ox + shapeW - RW + RCR},${oy + stepY}`}
                            fill="none" stroke={purple} strokeWidth="2" strokeDasharray="3,2"
                        />
                        <line x1={ox + shapeW - RW + RCR * 0.4} y1={oy + stepY + RCR * 0.4}
                            x2={ox + shapeW - RW - 15} y2={oy + stepY + RCR + 20}
                            stroke={purple} strokeWidth="0.6" />
                        <circle cx={ox + shapeW - RW + RCR * 0.4} cy={oy + stepY + RCR * 0.4} r="2" fill={purple} />
                        <text x={ox + shapeW - RW - 17} y={oy + stepY + RCR + 24}
                            fontSize="10" fill={purple} fontWeight="800" textAnchor="end">
                            R{rearCornerRadiusMm}
                        </text>
                    </g>
                )}

                {/* ═══ LEGEND ═══ */}
                <g transform={`translate(${8}, ${vbH - 12})`}>
                    <circle cx="4" cy="-3" r="3" fill={blue} opacity="0.7" />
                    <text x="10" y="0" fontSize="7" fill="#888" fontWeight="600">Front Face</text>
                    <circle cx="64" cy="-3" r="3" fill={orange} opacity="0.7" />
                    <text x="70" y="0" fontSize="7" fill="#888" fontWeight="600">Rebate</text>
                    <circle cx="108" cy="-3" r="3" fill={green} opacity="0.7" />
                    <text x="114" y="0" fontSize="7" fill="#888" fontWeight="600">R Front</text>
                    <circle cx="152" cy="-3" r="3" fill={purple} opacity="0.7" />
                    <text x="158" y="0" fontSize="7" fill="#888" fontWeight="600">R Inner</text>
                </g>
            </svg>

            {/* Title badge */}
            <div className="absolute top-1.5 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-stone-100 shadow-sm">
                <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase">
                    Cross-Section
                </span>
            </div>
        </div>
    );
}
