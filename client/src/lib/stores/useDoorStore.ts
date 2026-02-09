import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-using types from the original spec
export type DoorPreset = "single" | "double" | "shaker_2" | "shaker_4" | "shaker_6" | "panel_3" | "panel_4" | "panel_6";
export type PanelType = "STANDARD_12MM" | "REEDED_19MM" | "MELAMINE_18MM" | "FRETWORK" | "GLASS" | "NONE";
export type PanelOrientation = "vertical" | "horizontal";
export type DoorShape = "rectangular" | "angled";
export type MaterialType = "MDF";
export type FinishType = "RAW_UNASSEMBLED" | "ASSEMBLED_PREP" | "PRIMED";
export type HingeType = "SCREW_POINTS" | "INSERTA";

export interface Hinge {
    id: string;
    positionFromBottomMm: number;
    side: "LEFT" | "RIGHT";
    type: HingeType;
}

export interface MidRail {
    id: string;
    positionFromBottom: number;
    dimension: number;
}

export interface DoorConfig {
    id: string;
    label: string; // "Kitchen Base 1"
    qty: number;

    width: number;
    height: number;
    thickness: number;
    preset: DoorPreset;
    panelType: PanelType;
    panelCount: number;
    panelOrientation: PanelOrientation;
    shape: DoorShape;

    angledLeft: boolean;
    angledRight: boolean;
    leftTriangleCutoutWidth: number;
    leftTriangleCutoutHeight: number;
    rightTriangleCutoutWidth: number;
    rightTriangleCutoutHeight: number;

    borderWidth: number;
    customBorders: boolean;
    leftStile: number;
    rightStile: number;
    bottomRail: number;
    topRail: number;

    rebateWidthMm: number;
    rebateDepthMm: number;
    frontFaceThicknessMm: number;
    cornerRadiusMm: number;

    midRailsEnabled: boolean;
    midRailsEqualise: boolean;
    midRails: MidRail[];

    hingeDrilling: boolean;
    hinges: Hinge[];

    material: MaterialType;
    finish: FinishType;
    showDimensions: boolean;

    // Calculated
    price: number;
}

interface DoorStore {
    doors: DoorConfig[];
    activeDoorId: string | null;

    addDoor: (config?: Partial<DoorConfig>) => void;
    duplicateDoor: (id: string) => void;
    removeDoor: (id: string) => void;
    updateDoor: (id: string, updates: Partial<DoorConfig>) => void;
    setActiveDoor: (id: string | null) => void;
    resetStore: () => void;

    // Helpers
    calculatePrice: (door: DoorConfig) => number;
}

// Default Configuration for new doors
const DEFAULT_DOOR: Omit<DoorConfig, "id" | "label" | "price"> = {
    qty: 1,
    width: 400,
    height: 720,
    thickness: 22,
    preset: "single",
    panelType: "STANDARD_12MM",
    panelCount: 1,
    panelOrientation: "vertical",
    shape: "rectangular",

    angledLeft: false,
    angledRight: false,
    leftTriangleCutoutWidth: 200,
    leftTriangleCutoutHeight: 300,
    rightTriangleCutoutWidth: 200,
    rightTriangleCutoutHeight: 300,

    borderWidth: 70,
    customBorders: false,
    leftStile: 70,
    rightStile: 70,
    bottomRail: 70,
    topRail: 70,

    rebateWidthMm: 10,
    rebateDepthMm: 14,
    frontFaceThicknessMm: 8,
    cornerRadiusMm: 2.5,

    midRailsEnabled: false,
    midRailsEqualise: false,
    midRails: [],

    hingeDrilling: false,
    hinges: [],

    material: "MDF",
    finish: "RAW_UNASSEMBLED",
    showDimensions: true,
};

// Pricing Logic
const calculatePrice = (door: DoorConfig): number => {
    const FIXED_FEE = 3.00;
    const SQM_RATE_SHAKER = 75.00;
    const SQM_RATE_SLAB = 45.00;
    const ANGLED_FEE = 25.00;
    const MID_RAIL_FEE = 5.00;
    const HINGE_HOLE_FEE = 1.50;

    const areaM2 = (door.width * door.height) / 1000000;
    const isSlab = door.panelType === "NONE";
    const sqmRate = isSlab ? SQM_RATE_SLAB : SQM_RATE_SHAKER;

    let price = FIXED_FEE + (areaM2 * sqmRate);

    // Angled surcharge
    if (door.angledLeft || door.angledRight) {
        price += ANGLED_FEE;
    }

    // Mid rail surcharges
    if (door.midRailsEnabled) {
        price += door.midRails.length * MID_RAIL_FEE;
    }

    // Hinge drilling surcharges
    if (door.hingeDrilling) {
        // Filter valid hinges logic
        const validHingesCount = door.hinges.filter(hinge => {
            const hY = hinge.positionFromBottomMm;
            const hX = (hinge.side === "LEFT" ? 22 : door.width - 22);

            if (hinge.side === "LEFT" && door.angledLeft) {
                if ((hX) / door.leftTriangleCutoutWidth + (door.height - hY) / door.leftTriangleCutoutHeight < 1) return false;
            } else if (hinge.side === "RIGHT" && door.angledRight) {
                if ((door.width - hX) / door.rightTriangleCutoutWidth + (door.height - hY) / door.rightTriangleCutoutHeight < 1) return false;
            }
            return true;
        }).length;

        price += validHingesCount * HINGE_HOLE_FEE;
    }

    // Finish multiplier
    const finishMultipliers: Record<FinishType, number> = {
        RAW_UNASSEMBLED: 1.0,
        ASSEMBLED_PREP: 1.3,
        PRIMED: 1.8,
    };
    price *= finishMultipliers[door.finish] || 1.0;

    // Panel upgrades
    if (door.panelType === "REEDED_19MM") {
        price += 10 + (areaM2 * 60);
    } else if (door.panelType === "MELAMINE_18MM") {
        price += 10 + (areaM2 * 40);
    }

    // Multiply by Qty
    return (Math.round(price * 100) / 100) * door.qty;
};

export const useDoorStore = create<DoorStore>()(
    persist(
        (set, get) => ({
            doors: [],
            activeDoorId: null,

            addDoor: (config?: Partial<DoorConfig>) => {
                const id = Math.random().toString(36).substr(2, 9);
                const base = config ? { ...DEFAULT_DOOR, ...config } : DEFAULT_DOOR;
                const newDoor = {
                    ...base,
                    id,
                    label: config?.label || "New Door",
                    price: 0
                } as DoorConfig;

                newDoor.price = calculatePrice(newDoor);

                set((state) => ({
                    doors: [...state.doors, newDoor],
                    activeDoorId: id
                }));
            },

            duplicateDoor: (id) => {
                const state = get();
                const original = state.doors.find(d => d.id === id);
                if (!original) return;

                const newId = Math.random().toString(36).substr(2, 9);
                const copy = { ...original, id: newId, label: original.label + " (Copy)" };

                set((state) => ({
                    doors: [...state.doors, copy],
                    activeDoorId: newId // Make the copy active
                }));
            },

            removeDoor: (id) => {
                set((state) => {
                    const nextDoors = state.doors.filter(d => d.id !== id);
                    let nextActiveId = state.activeDoorId;

                    // If we deleted the active door, pick the first available one
                    if (state.activeDoorId === id) {
                        nextActiveId = nextDoors.length > 0 ? nextDoors[0].id : null;
                    }

                    // If no doors left, add a default one immediately
                    if (nextDoors.length === 0) {
                        const newId = Math.random().toString(36).substr(2, 9);
                        const newDoor = {
                            ...DEFAULT_DOOR,
                            id: newId,
                            label: "New Door",
                            price: 0
                        } as DoorConfig;
                        newDoor.price = calculatePrice(newDoor);
                        return {
                            doors: [newDoor],
                            activeDoorId: newId
                        };
                    }

                    return {
                        doors: nextDoors,
                        activeDoorId: nextActiveId
                    };
                });
            },

            updateDoor: (id, updates) => {
                set((state) => ({
                    doors: state.doors.map(door => {
                        if (door.id !== id) return door;
                        let updated = { ...door, ...updates };

                        // Apply Preset Defaults if preset changed
                        if (updates.preset && updates.preset !== door.preset) {
                            switch (updates.preset) {
                                case "single":
                                    updated.midRailsEnabled = false;
                                    updated.midRailsEqualise = false;
                                    updated.midRails = [];
                                    break;
                                case "double":
                                    updated.midRailsEnabled = false;
                                    updated.midRailsEqualise = false;
                                    updated.midRails = [];
                                    if (updated.width < 600) updated.width = 800;
                                    break;
                                case "shaker_2":
                                    updated.midRailsEnabled = true;
                                    updated.midRailsEqualise = true;
                                    break;
                                case "shaker_4":
                                    updated.midRailsEnabled = true;
                                    updated.midRailsEqualise = true;
                                    break;
                            }
                        }

                        // Handle Mid Rail Equalization
                        if (updated.midRailsEnabled && updated.midRailsEqualise) {
                            const count = updated.preset === "shaker_4" ? 3 : (updated.preset === "shaker_2" ? 1 : updated.midRails.length);
                            const spacing = updated.height / (count + 1);
                            updated.midRails = Array.from({ length: count }, (_, i) => ({
                                id: `r${i + 1}`,
                                positionFromBottom: Math.round(spacing * (i + 1)),
                                dimension: updated.borderWidth
                            }));
                        }

                        // Clamp Borders (Stiles/Rails)
                        const MIN_BORDER = 35;
                        const MIN_PANEL = 50;

                        if (updated.borderWidth !== undefined) updated.borderWidth = Math.max(MIN_BORDER, updated.borderWidth);
                        if (updated.leftStile !== undefined) updated.leftStile = Math.max(MIN_BORDER, updated.leftStile);
                        if (updated.rightStile !== undefined) updated.rightStile = Math.max(MIN_BORDER, updated.rightStile);
                        if (updated.topRail !== undefined) updated.topRail = Math.max(MIN_BORDER, updated.topRail);
                        if (updated.bottomRail !== undefined) updated.bottomRail = Math.max(MIN_BORDER, updated.bottomRail);

                        // Ensure panel area is at least 50mm
                        // Limit stiles relative to width
                        const maxStileWidth = (updated.width - MIN_PANEL) / 2;
                        if (updated.borderWidth > maxStileWidth) updated.borderWidth = Math.floor(maxStileWidth);
                        if (updated.leftStile > maxStileWidth) updated.leftStile = Math.floor(maxStileWidth);
                        if (updated.rightStile > maxStileWidth) updated.rightStile = Math.floor(maxStileWidth);

                        // Limit rails relative to height
                        const maxRailHeight = (updated.height - MIN_PANEL) / 2;
                        if (updated.topRail > maxRailHeight) updated.topRail = Math.floor(maxRailHeight);
                        if (updated.bottomRail > maxRailHeight) updated.bottomRail = Math.floor(maxRailHeight);

                        // Clamp Angled Cutouts to prevent collapse
                        if (updated.angledLeft) {
                            updated.leftTriangleCutoutWidth = Math.min(updated.leftTriangleCutoutWidth, updated.width - 100);
                            updated.leftTriangleCutoutHeight = Math.min(updated.leftTriangleCutoutHeight, updated.height - 150);
                        }
                        if (updated.angledRight) {
                            updated.rightTriangleCutoutWidth = Math.min(updated.rightTriangleCutoutWidth, updated.width - 100);
                            updated.rightTriangleCutoutHeight = Math.min(updated.rightTriangleCutoutHeight, updated.height - 150);
                        }

                        // Recalculate price
                        updated.price = calculatePrice(updated);
                        return updated;
                    })
                }));
            },

            setActiveDoor: (id) => set({ activeDoorId: id }),

            resetStore: () => set({ doors: [], activeDoorId: null }),

            calculatePrice
        }),
        {
            name: 'door-order-storage',
        }
    )
);
