import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { calculateDoorPrice, DEFAULT_PRICING } from "@shared/doorSchema";
import {
  MIN_BORDER_WITH_HINGES,
  MIN_BORDER_WITHOUT_HINGES,
  type Hinge,
  type MidRail,
  type FinishType,
  type PanelType,
  type HingeType,
  type DoorPreset,
} from "./useDoorConfig";

// =====================================================
// TYPES
// =====================================================

export interface DoorOrderItem {
  id: string;
  label: string;
  qty: number;

  // Dimensions
  width: number;
  height: number;
  thickness: number; // 18 or 22

  // Style
  preset: DoorPreset;
  panelType: PanelType;
  panelCount: number;
  panelOrientation: "vertical" | "horizontal";
  shape: "rectangular" | "angled";

  // Angled corners
  angledLeft: boolean;
  angledRight: boolean;
  leftTriangleCutoutWidth: number;
  leftTriangleCutoutHeight: number;
  rightTriangleCutoutWidth: number;
  rightTriangleCutoutHeight: number;
  leftAngleDegrees: number;
  rightAngleDegrees: number;
  leftAngledRailWidth: number;
  rightAngledRailWidth: number;

  // Borders
  borderWidth: number;
  customBorders: boolean;
  leftStile: number;
  rightStile: number;
  bottomRail: number;
  topRail: number;

  // Rebate
  rebateWidthMm: number;
  rebateDepthMm: number;
  frontFaceThicknessMm: number;
  cornerRadiusMm: number;

  // Mid rails
  midRailsEnabled: boolean;
  midRailsEqualise: boolean;
  midRails: MidRail[];

  // Hinges
  hingeDrilling: boolean;
  hinges: Hinge[];

  // Material & Finish
  material: string;
  finish: FinishType;
  showDimensions: boolean;

  // Pricing breakdown
  unitPrice: number;
  lineTotal: number;
}

interface DoorStore {
  doors: DoorOrderItem[];
  activeDoorId: string | null;

  // CRUD
  addDoor: (config?: Partial<DoorOrderItem>) => string;
  duplicateDoor: (id: string) => string | null;
  removeDoor: (id: string) => void;
  updateDoor: (id: string, updates: Partial<DoorOrderItem>) => void;
  setActiveDoor: (id: string | null) => void;
  resetStore: () => void;

  // Catalogue mode operations (per requirements)
  swapHingeSide: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateDimensions: (id: string, width?: number, height?: number) => void;
  updateFinish: (id: string, finish: FinishType) => void;
  restoreState: (doors: DoorOrderItem[]) => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  getVat: () => number;
  getGrandTotal: () => number;
}

// =====================================================
// DEFAULT DOOR CONFIG
// =====================================================

const DEFAULT_DOOR: Omit<DoorOrderItem, "id" | "label" | "unitPrice" | "lineTotal"> = {
  qty: 1,
  width: 600,
  height: 720,
  thickness: 22,
  preset: "single",
  panelType: "STANDARD_12MM",
  panelCount: 1,
  panelOrientation: "vertical",
  shape: "rectangular",

  angledLeft: false,
  angledRight: false,
  leftTriangleCutoutWidth: 0,
  leftTriangleCutoutHeight: 0,
  rightTriangleCutoutWidth: 0,
  rightTriangleCutoutHeight: 0,
  leftAngleDegrees: 0,
  rightAngleDegrees: 0,
  leftAngledRailWidth: 90,
  rightAngledRailWidth: 90,

  borderWidth: 90,
  customBorders: false,
  leftStile: 90,
  rightStile: 90,
  bottomRail: 90,
  topRail: 90,

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

// =====================================================
// HELPERS
// =====================================================

function generateId(): string {
  return `door_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateLabel(door: Partial<DoorOrderItem>, index?: number): string {
  const style = door.panelType === "NONE" ? "Slab" : "Shaker";
  const dims = `${door.width || 600}×${door.height || 720}`;
  const prefix = index !== undefined ? `Door ${index + 1}` : "New Door";
  return `${prefix} — ${style} ${dims}mm`;
}

/**
 * Calculate price for a single door using the shared pricing function
 */
function computePrice(door: DoorOrderItem): { unitPrice: number; lineTotal: number } {
  const result = calculateDoorPrice({
    width: door.width,
    height: door.height,
    thickness: door.thickness as 18 | 22,
    preset: door.preset,
    panelType: door.panelType,
    panelCount: door.panelCount,
    borderWidth: door.borderWidth,
    customBorders: door.customBorders,
    leftStile: door.customBorders ? door.leftStile : door.borderWidth,
    rightStile: door.customBorders ? door.rightStile : door.borderWidth,
    topRail: door.customBorders ? door.topRail : door.borderWidth,
    bottomRail: door.customBorders ? door.bottomRail : door.borderWidth,
    rebateWidthMm: door.rebateWidthMm,
    rebateDepthMm: door.rebateDepthMm,
    frontFaceThicknessMm: door.frontFaceThicknessMm,
    cornerRadiusMm: door.cornerRadiusMm,
    angledLeft: door.angledLeft,
    angledRight: door.angledRight,
    leftTriangleCutoutWidth: door.leftTriangleCutoutWidth,
    leftTriangleCutoutHeight: door.leftTriangleCutoutHeight,
    rightTriangleCutoutWidth: door.rightTriangleCutoutWidth,
    rightTriangleCutoutHeight: door.rightTriangleCutoutHeight,
    leftAngleDegrees: door.leftAngleDegrees,
    rightAngleDegrees: door.rightAngleDegrees,
    leftAngledRailWidth: door.leftAngledRailWidth ?? 90,
    rightAngledRailWidth: door.rightAngledRailWidth ?? 90,
    midRailsEnabled: door.midRailsEnabled,
    midRails: door.midRails,
    hingeDrilling: door.hingeDrilling,
    hinges: door.hinges,
    material: door.material,
    finish: door.finish,
    showDimensions: door.showDimensions,
    price: 0,
  });

  return {
    unitPrice: result.unitTotal,
    lineTotal: Math.round(result.unitTotal * door.qty * 100) / 100,
  };
}

/**
 * Enforce business rules on a door config
 */
export function enforceDoorRules(door: DoorOrderItem): DoorOrderItem {
  let updated = { ...door };

  // Safety checks for arrays
  if (!updated.hinges) updated.hinges = [];
  if (!updated.midRails) updated.midRails = [];

  // RULE: 18mm only for slab
  if (updated.thickness === 18 && updated.panelType !== "NONE") {
    updated.panelType = "NONE";
  }

  // RULE: Reeded/melamine only for 22mm
  if (updated.thickness !== 22 && (updated.panelType === "REEDED_19MM" || updated.panelType === "MELAMINE_18MM")) {
    updated.thickness = 22;
  }

  // RULE: Minimum borders
  const hingeSides = new Set(updated.hinges.map(h => h.side));

  const minLeft = updated.hingeDrilling && hingeSides.has("LEFT")
    ? MIN_BORDER_WITH_HINGES : MIN_BORDER_WITHOUT_HINGES;
  const minRight = updated.hingeDrilling && hingeSides.has("RIGHT")
    ? MIN_BORDER_WITH_HINGES : MIN_BORDER_WITHOUT_HINGES;

  updated.leftStile = Math.max(updated.leftStile, minLeft);
  updated.rightStile = Math.max(updated.rightStile, minRight);
  updated.topRail = Math.max(updated.topRail, MIN_BORDER_WITHOUT_HINGES);
  updated.bottomRail = Math.max(updated.bottomRail, MIN_BORDER_WITHOUT_HINGES);

  if (!updated.customBorders) {
    const minBorder = Math.max(minLeft, minRight, MIN_BORDER_WITHOUT_HINGES);
    updated.borderWidth = Math.max(updated.borderWidth, minBorder);
    updated.leftStile = Math.max(updated.borderWidth, minLeft);
    updated.rightStile = Math.max(updated.borderWidth, minRight);
    updated.topRail = updated.borderWidth;
    updated.bottomRail = updated.borderWidth;
  }

  // RULE: Panel area must be at least 50mm
  const MIN_PANEL = 50;
  const maxStileWidth = (updated.width - MIN_PANEL) / 2;
  updated.leftStile = Math.min(updated.leftStile, Math.floor(maxStileWidth));
  updated.rightStile = Math.min(updated.rightStile, Math.floor(maxStileWidth));

  const maxRailHeight = (updated.height - MIN_PANEL) / 2;
  updated.topRail = Math.min(updated.topRail, Math.floor(maxRailHeight));
  updated.bottomRail = Math.min(updated.bottomRail, Math.floor(maxRailHeight));

  // RULE: Clamp angled cutouts
  if (updated.angledLeft) {
    updated.leftTriangleCutoutWidth = Math.min(updated.leftTriangleCutoutWidth, updated.width - 100);
    updated.leftTriangleCutoutHeight = Math.min(updated.leftTriangleCutoutHeight, updated.height - 150);
  }
  if (updated.angledRight) {
    updated.rightTriangleCutoutWidth = Math.min(updated.rightTriangleCutoutWidth, updated.width - 100);
    updated.rightTriangleCutoutHeight = Math.min(updated.rightTriangleCutoutHeight, updated.height - 150);
  }

  // Recalculate price
  const { unitPrice, lineTotal } = computePrice(updated);
  updated.unitPrice = unitPrice;
  updated.lineTotal = lineTotal;

  return updated;
}

// =====================================================
// STORE
// =====================================================

export const useDoorStore = create<DoorStore>()(
  persist(
    (set, get) => ({
      doors: [],
      activeDoorId: null,

      addDoor: (config?: Partial<DoorOrderItem>): string => {
        const id = generateId();
        const base = config ? { ...DEFAULT_DOOR, ...config } : DEFAULT_DOOR;
        const index = get().doors.length;

        let newDoor: DoorOrderItem = {
          ...base,
          id,
          label: config?.label || generateLabel(base, index),
          unitPrice: 0,
          lineTotal: 0,
        } as DoorOrderItem;

        newDoor = enforceDoorRules(newDoor);

        set((state) => ({
          doors: [...state.doors, newDoor],
          activeDoorId: id,
        }));

        return id;
      },

      duplicateDoor: (id: string): string | null => {
        const state = get();
        const original = state.doors.find(d => d.id === id);
        if (!original) return null;

        const newId = generateId();
        let hingeIdCounter = Date.now();

        // Deep copy with new IDs for hinges and mid-rails
        const copy: DoorOrderItem = {
          ...original,
          id: newId,
          label: `${original.label} (Copy)`,
          hinges: original.hinges.map(h => ({
            ...h,
            id: `hinge_dup_${++hingeIdCounter}`,
          })),
          midRails: original.midRails.map(r => ({
            ...r,
            id: `rail_dup_${++hingeIdCounter}`,
          })),
        };

        set((state) => ({
          doors: [...state.doors, copy],
          activeDoorId: newId,
        }));

        return newId;
      },

      removeDoor: (id: string) => {
        set((state) => {
          const nextDoors = state.doors.filter(d => d.id !== id);
          let nextActiveId = state.activeDoorId;

          if (state.activeDoorId === id) {
            nextActiveId = nextDoors.length > 0 ? nextDoors[0].id : null;
          }

          return {
            doors: nextDoors,
            activeDoorId: nextActiveId,
          };
        });
      },

      updateDoor: (id: string, updates: Partial<DoorOrderItem>) => {
        set((state) => ({
          doors: state.doors.map(door => {
            if (door.id !== id) return door;
            const merged = { ...door, ...updates };
            return enforceDoorRules(merged);
          }),
        }));
      },

      setActiveDoor: (id: string | null) => set({ activeDoorId: id }),

      resetStore: () => set({ doors: [], activeDoorId: null }),

      // ─── CATALOGUE MODE OPERATIONS ───

      /**
       * Quick swap all hinges on a door from LEFT↔RIGHT
       * Requirements: "easy to swap from left to right hinge side drilling"
       */
      swapHingeSide: (id: string) => {
        set((state) => ({
          doors: state.doors.map(door => {
            if (door.id !== id) return door;

            const swapped = {
              ...door,
              hinges: door.hinges.map(h => ({
                ...h,
                side: (h.side === "LEFT" ? "RIGHT" : "LEFT") as "LEFT" | "RIGHT",
              })),
            };

            return enforceDoorRules(swapped);
          }),
        }));
      },

      /**
       * Quick quantity update from catalogue list
       */
      updateQuantity: (id: string, qty: number) => {
        const clampedQty = Math.max(1, Math.min(100, qty));
        set((state) => ({
          doors: state.doors.map(door => {
            if (door.id !== id) return door;
            const updated = { ...door, qty: clampedQty };
            updated.lineTotal = Math.round(updated.unitPrice * clampedQty * 100) / 100;
            return updated;
          }),
        }));
      },

      /**
       * Quick inline dimension change from catalogue list
       */
      updateDimensions: (id: string, width?: number, height?: number) => {
        set((state) => ({
          doors: state.doors.map(door => {
            if (door.id !== id) return door;
            const updates: Partial<DoorOrderItem> = {};
            if (width !== undefined) updates.width = Math.max(200, Math.min(1200, width));
            if (height !== undefined) updates.height = Math.max(200, Math.min(2430, height));
            return enforceDoorRules({ ...door, ...updates });
          }),
        }));
      },

      /**
       * Quick inline finish change from catalogue list
       */
      updateFinish: (id: string, finish: FinishType) => {
        set((state) => ({
          doors: state.doors.map(door => {
            if (door.id !== id) return door;
            return enforceDoorRules({ ...door, finish });
          }),
        }));
      },

      /**
       * Restore state from backup
       */
      restoreState: (doors: DoorOrderItem[]) => {
        set({
          doors: doors.map(d => enforceDoorRules(d)),
          activeDoorId: doors.length > 0 ? doors[0].id : null
        });
      },

      // ─── COMPUTED TOTALS ───

      getTotalItems: () => {
        return get().doors.reduce((sum, d) => sum + d.qty, 0);
      },

      getSubtotal: () => {
        return Math.round(
          get().doors.reduce((sum, d) => sum + d.lineTotal, 0) * 100
        ) / 100;
      },

      getVat: () => {
        // VAT removed per user request
        return 0;
      },

      getGrandTotal: () => {
        const sub = get().getSubtotal();
        // VAT removed per user request
        return Math.round(sub * 100) / 100;
      },
    }),
    {
      name: "door-order-storage",
      version: 4,
      migrate: (persistedState: any, version: number) => {
        const migrated = persistedState || { doors: [], activeDoorId: null };

        // Ensure doors array exists
        if (!Array.isArray(migrated.doors)) {
          migrated.doors = [];
        }

        // Migration v2 -> v3: Add left/rightAngledRailWidth
        if (version < 3) {
          migrated.doors = migrated.doors.map((d: any) => ({
            ...d,
            leftAngledRailWidth: d.leftAngledRailWidth ?? d.angledRailWidth ?? 90,
            rightAngledRailWidth: d.rightAngledRailWidth ?? d.angledRailWidth ?? 90,
          }));
        }

        // Migration v3 -> v4: Ensure all fields exist with defaults
        if (version < 4) {
          migrated.doors = migrated.doors.map((d: any) => {
            // Ensure arrays are initialized
            if (!Array.isArray(d.midRails)) {
              d.midRails = [];
            }
            if (!Array.isArray(d.hinges)) {
              d.hinges = [];
            }

            // Ensure critical numeric fields have defaults
            if (typeof d.rebateWidthMm !== 'number' || isNaN(d.rebateWidthMm)) {
              d.rebateWidthMm = DEFAULT_DOOR.rebateWidthMm;
            }
            if (typeof d.rebateDepthMm !== 'number' || isNaN(d.rebateDepthMm)) {
              d.rebateDepthMm = DEFAULT_DOOR.rebateDepthMm;
            }
            if (typeof d.frontFaceThicknessMm !== 'number' || isNaN(d.frontFaceThicknessMm)) {
              d.frontFaceThicknessMm = DEFAULT_DOOR.frontFaceThicknessMm;
            }
            if (typeof d.cornerRadiusMm !== 'number' || isNaN(d.cornerRadiusMm)) {
              d.cornerRadiusMm = DEFAULT_DOOR.cornerRadiusMm;
            }
            if (typeof d.leftAngledRailWidth !== 'number' || isNaN(d.leftAngledRailWidth)) {
              d.leftAngledRailWidth = DEFAULT_DOOR.leftAngledRailWidth;
            }
            if (typeof d.rightAngledRailWidth !== 'number' || isNaN(d.rightAngledRailWidth)) {
              d.rightAngledRailWidth = DEFAULT_DOOR.rightAngledRailWidth;
            }

            return d;
          });
        }

        return migrated;
      },
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          console.warn("Door store hydration failed or state is empty");
        } else {
          console.log("Door store hydrated:", state.doors.length, "doors");
          // Ensure all doors have valid prices
          try {
            state.doors.forEach((door) => {
              if (typeof door.unitPrice !== 'number' || isNaN(door.unitPrice)) {
                const { unitPrice, lineTotal } = computePrice(door);
                door.unitPrice = unitPrice;
                door.lineTotal = lineTotal;
              }
            });
          } catch (error) {
            console.error("Error recalculating prices on hydration:", error);
          }
        }
      },
    }
  )
);