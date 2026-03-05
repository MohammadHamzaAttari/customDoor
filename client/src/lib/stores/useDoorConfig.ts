// client/src/lib/stores/useDoorConfig.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { calculateAngleFromCutout } from "../anglePresets";
import { calculateDoorPrice, DEFAULT_PRICING } from "@shared/doorSchema";

export type DoorPreset = "single" | "double" | "shaker_2" | "shaker_4" | "shaker_6" | "panel_3" | "panel_4" | "panel_6";
export type PanelType = "STANDARD_12MM" | "STANDARD_9MM" | "REEDED_19MM" | "MELAMINE_18MM" | "FRETWORK" | "GLASS" | "NONE";
export type PanelOrientation = "vertical" | "horizontal";
export type BorderStyle = "none" | "simple" | "detailed";
export type DoorShape = "rectangular" | "angled";
export type MaterialType = "MDF" | "OAK" | "WALNUT" | "PINE";
export type FinishType = "RAW_UNASSEMBLED" | "ASSEMBLED_PREP" | "PRIMED" | "PAINTED";
export type HingeType = "SCREW_POINTS" | "INSERTA";
export type ViewSide = "front" | "back";

// Hinge center offset: 5mm gap to edge + 17.5mm (half of 35mm cup) = 22.5mm
export const HINGE_CENTER_OFFSET_MM = 22.5;
export const HINGE_CUP_DIAMETER_MM = 35;
export const HINGE_CUP_DEPTH_MM = 13;

// Border minimums per requirements
export const MIN_BORDER_WITH_HINGES = 65;
export const MIN_BORDER_WITHOUT_HINGES = 35;

// Dimension limits
export const MIN_WIDTH_MM = 200;
export const MAX_WIDTH_MM = 1200;
export const MIN_HEIGHT_MM = 200;
export const MAX_HEIGHT_MM = 2430;

export interface Hinge {
  id: string;
  positionMm: number;
  reference: "TOP" | "BOTTOM";
  side: "LEFT" | "RIGHT";
  type: HingeType;
}

export interface MidRail {
  id: string;
  positionFromBottom: number;
  dimension: number;
}

export interface DoorConfig {
  width: number;
  height: number;
  thickness: 22 | 18;
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
  leftAngleDegrees: number;
  rightAngleDegrees: number;
  leftAngledRailWidth: number;
  rightAngledRailWidth: number;

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
  rearCornerRadiusMm: number;

  midRailsEnabled: boolean;
  midRailsEqualise: boolean;
  midRails: MidRail[];

  hingeDrilling: boolean;
  hinges: Hinge[];

  material: MaterialType;
  finish: FinishType;
  showDimensions: boolean;
  viewSide: ViewSide;
  price: number;
  selectedSection: string;
  editingCartItemId: string | null;
  isNewSession: boolean;
  _hasInteracted: boolean;
}

interface DoorConfigStore extends DoorConfig {
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setThickness: (thickness: 22 | 18) => void;
  setPreset: (preset: DoorPreset) => void;
  setPanelType: (type: PanelType) => void;
  setPanelCount: (count: number) => void;
  setPanelOrientation: (orientation: PanelOrientation) => void;
  setShape: (shape: DoorShape) => void;

  setAngledLeft: (enabled: boolean) => void;
  setAngledRight: (enabled: boolean) => void;
  setLeftTriangleCutoutWidth: (width: number) => void;
  setLeftTriangleCutoutHeight: (height: number) => void;
  setRightTriangleCutoutWidth: (width: number) => void;
  setRightTriangleCutoutHeight: (height: number) => void;
  setLeftAngledRailWidth: (width: number) => void;
  setRightAngledRailWidth: (width: number) => void;

  setBorderWidth: (width: number) => void;
  setCustomBorders: (enabled: boolean) => void;
  setLeftStile: (width: number) => void;
  setRightStile: (width: number) => void;
  setBottomRail: (height: number) => void;
  setTopRail: (height: number) => void;

  setRebateWidth: (width: number) => void;
  setRebateDepth: (depth: number) => void;
  setFrontFaceThickness: (thickness: number) => void;
  setCornerRadius: (radius: number) => void;
  setRearCornerRadius: (radius: number) => void;

  setMidRailsEnabled: (enabled: boolean) => void;
  setMidRailsEqualise: (enabled: boolean) => void;
  addMidRail: () => void;
  removeMidRail: (id: string) => void;
  updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => void;

  setHingeDrilling: (enabled: boolean) => void;
  addHinge: (reference?: "TOP" | "BOTTOM") => void;
  removeHinge: (id: string) => void;
  updateHinge: (id: string, field: keyof Hinge, value: any) => void;
  swapHingeSide: () => void;
  equaliseHinges: () => void;
  setHinges: (hinges: Hinge[]) => void;

  setFinish: (finish: FinishType) => void;
  toggleDimensions: () => void;
  setViewSide: (side: ViewSide) => void;
  calculatePrice: () => void;
  resetConfig: () => void;
  setSelectedSection: (section: string) => void;
  setEditingCartItemId: (id: string | null) => void;
  loadFromCartItem: (item: any) => void;
  clearNewSession: () => void;

  // Computed helpers
  getMinBorderForSide: (side: "LEFT" | "RIGHT" | "TOP" | "BOTTOM") => number;
}

const initialState: DoorConfig = {
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
  leftTriangleCutoutWidth: 180,
  leftTriangleCutoutHeight: 400,
  rightTriangleCutoutWidth: 180,
  rightTriangleCutoutHeight: 400,
  leftAngleDegrees: 42,
  rightAngleDegrees: 42,
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
  rearCornerRadiusMm: 2.5,

  midRailsEnabled: false,
  midRailsEqualise: false,
  midRails: [],

  hingeDrilling: false,
  hinges: [],

  material: "MDF",
  finish: "RAW_UNASSEMBLED",
  showDimensions: true,
  viewSide: "front" as ViewSide,
  price: 0,
  selectedSection: "dimensions",
  editingCartItemId: null,
  isNewSession: true,
  _hasInteracted: false,
};

let midRailIdCounter = 0;
let hingeIdCounter = 0;

/**
 * Re-compute equalized mid-rail positions based on current door state.
 * Returns the unchanged array if equalization is off or there are no rails.
 */
function reEqualiseMidRails(state: DoorConfig): MidRail[] {
  if (!state.midRailsEqualise || state.midRails.length === 0) return state.midRails;
  const railCount = state.midRails.length;
  const usableHeight = state.height - state.bottomRail - state.topRail;
  const totalRailsWidth = state.midRails.reduce((sum, r) => sum + r.dimension, 0);
  const gapCount = railCount + 1;
  const gapHeight = (usableHeight - totalRailsWidth) / gapCount;
  let currentPos = state.bottomRail + gapHeight;
  return [...state.midRails]
    .sort((a, b) => a.positionFromBottom - b.positionFromBottom)
    .map((rail) => {
      const newRail = { ...rail, positionFromBottom: Math.round(currentPos) };
      currentPos += rail.dimension + gapHeight;
      return newRail;
    });
}

/**
 * Get minimum border width for a given side based on whether hinges are present on that side
 */
function getMinBorder(hingeDrilling: boolean, hinges: Hinge[], side: "LEFT" | "RIGHT" | "TOP" | "BOTTOM"): number {
  if (!hingeDrilling || hinges.length === 0) {
    return MIN_BORDER_WITHOUT_HINGES;
  }

  // Check if any hinge is on this side
  if (side === "LEFT" || side === "RIGHT") {
    const hasHingeOnSide = hinges.some(h => h.side === side);
    return hasHingeOnSide ? MIN_BORDER_WITH_HINGES : MIN_BORDER_WITHOUT_HINGES;
  }

  // Top and bottom rails: always 35mm minimum
  return MIN_BORDER_WITHOUT_HINGES;
}

/**
 * Resilient storage adapter for Zustand persist.
 * Tries localStorage first; if blocked (e.g. cross-origin iframe), falls back to sessionStorage.
 */
function createResilientStorage(): Storage {
  // Test if localStorage is available and writable
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    // localStorage blocked (third-party iframe, private browsing, etc.)
    try {
      const testKey = '__storage_test__';
      sessionStorage.setItem(testKey, '1');
      sessionStorage.removeItem(testKey);
      console.warn('[DoorConfig] localStorage unavailable, using sessionStorage fallback');
      return sessionStorage;
    } catch {
      // Both blocked — return a no-op in-memory storage
      console.warn('[DoorConfig] No web storage available, state will not persist');
      const memoryStore: Record<string, string> = {};
      return {
        get length() { return Object.keys(memoryStore).length; },
        clear() { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); },
        getItem(key: string) { return memoryStore[key] ?? null; },
        key(index: number) { return Object.keys(memoryStore)[index] ?? null; },
        removeItem(key: string) { delete memoryStore[key]; },
        setItem(key: string, value: string) { memoryStore[key] = value; },
      };
    }
  }
}

export const useDoorConfig = create<DoorConfigStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getMinBorderForSide: (side: "LEFT" | "RIGHT" | "TOP" | "BOTTOM") => {
        const state = get();
        return getMinBorder(state.hingeDrilling, state.hinges, side);
      },

      clearNewSession: () => {
        if (get().isNewSession) {
          set({ isNewSession: false, _hasInteracted: true });
        }
      },

      setEditingCartItemId: (id: string | null) => {
        set({ editingCartItemId: id });
      },

      loadFromCartItem: (item: any) => {
        // Hydrate configurator state from a cart item.
        // We override the current state with the cart item's values.
        set({
          ...item,
          editingCartItemId: item.id,
          isNewSession: false,
          _hasInteracted: true,
        });
        get().calculatePrice();
      },

      setHinges: (hinges: Hinge[]) => {
        set({ hinges });
        get().calculatePrice();
      },

      setWidth: (width: number) => {
        if (isNaN(width)) return;
        get().clearNewSession();
        const clamped = Math.max(MIN_WIDTH_MM, Math.min(MAX_WIDTH_MM, Math.round(width)));
        set({ width: clamped });
        get().calculatePrice();
      },

      setHeight: (height: number) => {
        if (isNaN(height)) return;
        get().clearNewSession();
        const clamped = Math.max(MIN_HEIGHT_MM, Math.min(MAX_HEIGHT_MM, Math.round(height)));
        set({ height: clamped });
        // Re-equalize mid-rails with updated height
        const updated = reEqualiseMidRails({ ...get(), height: clamped });
        set({ midRails: updated });
        get().calculatePrice();
      },

      setThickness: (thickness: 22 | 18) => {
        get().clearNewSession();
        const state = get();
        if (thickness === 18 && state.panelType !== "NONE") {
          set({ thickness, panelType: "NONE" });
        } else {
          set({ thickness });
        }
        get().calculatePrice();
      },

      setPreset: (preset: DoorPreset) => {
        get().clearNewSession();
        set({ preset });
        get().calculatePrice();
      },

      setPanelType: (panelType: PanelType) => {
        get().clearNewSession();
        const state = get();
        if (state.thickness === 18 && panelType !== "NONE") {
          set({ panelType, thickness: 22 });
        } else if (panelType === "NONE") {
          set({ panelType, midRailsEnabled: false, customBorders: false });
        } else {
          if ((panelType === "REEDED_19MM" || panelType === "MELAMINE_18MM") && state.thickness !== 22) {
            set({ panelType, thickness: 22 });
          } else {
            set({ panelType });
          }
        }
        get().calculatePrice();
      },

      setPanelCount: (panelCount: number) => {
        get().clearNewSession();
        set({ panelCount });
        get().calculatePrice();
      },

      setPanelOrientation: (panelOrientation: PanelOrientation) => {
        set({ panelOrientation });
      },

      setShape: (shape: DoorShape) => {
        set({ shape });
      },

      setAngledLeft: (angledLeft: boolean) => {
        get().clearNewSession();
        set({ angledLeft });
        get().calculatePrice();
      },

      setAngledRight: (angledRight: boolean) => {
        get().clearNewSession();
        set({ angledRight });
        get().calculatePrice();
      },

      setLeftTriangleCutoutWidth: (width: number) => {
        if (isNaN(width) || width < 0) return;
        const state = get();
        // Prevent cutout from exceeding door width
        const maxWidth = state.width - 50;
        const clampedWidth = Math.min(width, maxWidth);
        set({
          leftTriangleCutoutWidth: clampedWidth,
          leftAngleDegrees: calculateAngleFromCutout(clampedWidth, state.leftTriangleCutoutHeight),
        });
      },

      setLeftTriangleCutoutHeight: (height: number) => {
        if (isNaN(height) || height < 0) return;
        const state = get();
        const maxHeight = state.height - 50;
        const clampedHeight = Math.min(height, maxHeight);
        set({
          leftTriangleCutoutHeight: clampedHeight,
          leftAngleDegrees: calculateAngleFromCutout(state.leftTriangleCutoutWidth, clampedHeight),
        });
      },

      setRightTriangleCutoutWidth: (width: number) => {
        if (isNaN(width) || width < 0) return;
        const state = get();
        const maxWidth = state.width - 50;
        const clampedWidth = Math.min(width, maxWidth);
        set({
          rightTriangleCutoutWidth: clampedWidth,
          rightAngleDegrees: calculateAngleFromCutout(clampedWidth, state.rightTriangleCutoutHeight),
        });
      },

      setRightTriangleCutoutHeight: (height: number) => {
        if (isNaN(height) || height < 0) return;
        const state = get();
        const maxHeight = state.height - 50;
        const clampedHeight = Math.min(height, maxHeight);
        set({
          rightTriangleCutoutHeight: clampedHeight,
          rightAngleDegrees: calculateAngleFromCutout(state.rightTriangleCutoutWidth, clampedHeight),
        });
      },

      setLeftAngledRailWidth: (leftAngledRailWidth: number) => {
        if (isNaN(leftAngledRailWidth)) return;
        set({ leftAngledRailWidth: Math.max(35, Math.min(200, leftAngledRailWidth)) });
      },

      setRightAngledRailWidth: (rightAngledRailWidth: number) => {
        if (isNaN(rightAngledRailWidth)) return;
        set({ rightAngledRailWidth: Math.max(35, Math.min(200, rightAngledRailWidth)) });
      },

      setBorderWidth: (borderWidth: number) => {
        if (isNaN(borderWidth) || borderWidth <= 0) return;
        get().clearNewSession();
        set({
          borderWidth,
          leftStile: borderWidth,
          rightStile: borderWidth,
          bottomRail: borderWidth,
          topRail: borderWidth,
          leftAngledRailWidth: borderWidth,
          rightAngledRailWidth: borderWidth,
        });
        // Re-equalize mid-rails with updated borders
        const updated = reEqualiseMidRails({ ...get(), bottomRail: borderWidth, topRail: borderWidth });
        set({ midRails: updated });
        get().calculatePrice();
      },

      setCustomBorders: (customBorders: boolean) => {
        const state = get();
        if (!customBorders) {
          set({
            customBorders,
            leftStile: state.borderWidth,
            rightStile: state.borderWidth,
            bottomRail: state.borderWidth,
            topRail: state.borderWidth,
            leftAngledRailWidth: state.borderWidth,
            rightAngledRailWidth: state.borderWidth,
          });
        } else {
          set({ customBorders });
        }
      },

      setLeftStile: (leftStile: number) => {
        if (isNaN(leftStile) || leftStile <= 0) return;
        set({ leftStile });
      },

      setRightStile: (rightStile: number) => {
        if (isNaN(rightStile) || rightStile <= 0) return;
        set({ rightStile });
      },

      setBottomRail: (bottomRail: number) => {
        if (isNaN(bottomRail) || bottomRail <= 0) return;
        set({ bottomRail });
        const updated = reEqualiseMidRails({ ...get(), bottomRail });
        set({ midRails: updated });
      },

      setTopRail: (topRail: number) => {
        if (isNaN(topRail) || topRail <= 0) return;
        set({ topRail });
        const updated = reEqualiseMidRails({ ...get(), topRail });
        set({ midRails: updated });
      },

      setRebateWidth: (rebateWidthMm: number) => set({ rebateWidthMm }),
      setRebateDepth: (rebateDepthMm: number) => set({ rebateDepthMm }),
      setFrontFaceThickness: (frontFaceThicknessMm: number) => set({ frontFaceThicknessMm }),
      setCornerRadius: (cornerRadiusMm: number) => set({ cornerRadiusMm }),
      setRearCornerRadius: (rearCornerRadiusMm: number) => set({ rearCornerRadiusMm }),

      setMidRailsEnabled: (midRailsEnabled: boolean) => {
        get().clearNewSession();
        set({ midRailsEnabled });
        if (midRailsEnabled && get().midRails.length === 0) {
          get().addMidRail();
        }
        get().calculatePrice();
      },

      setMidRailsEqualise: (midRailsEqualise: boolean) => {
        set({ midRailsEqualise });
        if (midRailsEqualise) {
          const updated = reEqualiseMidRails({ ...get(), midRailsEqualise });
          set({ midRails: updated });
        }
      },

      addMidRail: () => {
        const state = get();
        const newRail: MidRail = {
          id: `rail_${Date.now()}_${++midRailIdCounter}`,
          positionFromBottom: Math.round(state.height / 2),
          dimension: state.borderWidth,
        };
        const newRails = [...state.midRails, newRail];
        set({ midRails: newRails });
        // Re-equalize with the new rail included
        const updated = reEqualiseMidRails({ ...get(), midRails: newRails });
        set({ midRails: updated });
        get().calculatePrice();
      },

      removeMidRail: (id: string) => {
        const newRails = get().midRails.filter(rail => rail.id !== id);
        set({ midRails: newRails });
        // Re-equalize after removal
        const updated = reEqualiseMidRails({ ...get(), midRails: newRails });
        set({ midRails: updated });
        get().calculatePrice();
      },

      updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => {
        if (isNaN(value)) return;
        const clampedValue = field === 'dimension' ? Math.max(35, value) : value;
        const newRails = get().midRails.map(rail =>
          rail.id === id ? { ...rail, [field]: clampedValue } : rail
        );
        set({ midRails: newRails });
        // Re-equalize when dimension changes
        if (field === 'dimension') {
          const updated = reEqualiseMidRails({ ...get(), midRails: newRails });
          set({ midRails: updated });
        }
      },

      setHingeDrilling: (hingeDrilling: boolean) => {
        get().clearNewSession();
        set({ hingeDrilling });
        if (hingeDrilling && get().hinges.length === 0) {
          const state = get();
          const h1: Hinge = { id: `hinge_${Date.now()}_${++hingeIdCounter}`, positionMm: 100, reference: "TOP", side: "LEFT", type: "SCREW_POINTS" };
          const h2: Hinge = { id: `hinge_${Date.now()}_${++hingeIdCounter}`, positionMm: 100, reference: "BOTTOM", side: "LEFT", type: "SCREW_POINTS" };
          set({ hinges: [h1, h2] });

          // Enforce 65mm minimum on hinge side
          if (state.leftStile < MIN_BORDER_WITH_HINGES) {
            set({ leftStile: MIN_BORDER_WITH_HINGES });
            if (!state.customBorders) {
              set({ borderWidth: Math.max(state.borderWidth, MIN_BORDER_WITH_HINGES) });
            }
          }
        }
        get().calculatePrice();
      },

      addHinge: (ref?: "TOP" | "BOTTOM") => {
        const state = get();
        const existingSide = state.hinges.length > 0 ? state.hinges[0].side : "LEFT";
        const existingType = state.hinges.length > 0 ? state.hinges[0].type : "SCREW_POINTS";

        // If ref not provided, intelligently pick
        const reference = ref || (state.hinges.length > 0 && state.hinges[state.hinges.length - 1].reference === "TOP" ? "BOTTOM" : "TOP");

        const newHinge: Hinge = {
          id: `hinge_${Date.now()}_${++hingeIdCounter}`,
          positionMm: 100,
          reference,
          side: existingSide,
          type: existingType,
        };

        let updatedHinges = [...state.hinges, newHinge];

        // Ensure sorted order: Tops by distance from top, then Bottoms by distance from bottom
        updatedHinges.sort((a, b) => {
          if (a.reference === b.reference) return a.positionMm - b.positionMm;
          return a.reference === "TOP" ? -1 : 1;
        });

        set({ hinges: updatedHinges });

        // Auto-equalise only if they had no hinges or just one before
        if (updatedHinges.length === 2 && state.hinges.length < 2) {
          setTimeout(() => get().equaliseHinges(), 0);
        }
        get().calculatePrice();
      },

      removeHinge: (id: string) => {
        set((state) => ({
          hinges: state.hinges.filter(h => h.id !== id)
        }));
        get().calculatePrice();
      },

      updateHinge: (id: string, field: keyof Hinge, value: any) => {
        if (field === 'positionMm' && (isNaN(value) || value <= 0)) return;
        set((state) => ({
          hinges: state.hinges.map(h => h.id === id ? { ...h, [field]: value } : h)
        }));

        // If side changed, re-enforce border minimums
        if (field === 'side') {
          const state = get();
          const minLeft = getMinBorder(state.hingeDrilling, state.hinges, "LEFT");
          const minRight = getMinBorder(state.hingeDrilling, state.hinges, "RIGHT");

          if (state.leftStile < minLeft) set({ leftStile: minLeft });
          if (state.rightStile < minRight) set({ rightStile: minRight });
        }
      },

      swapHingeSide: () => {
        set((state) => ({
          hinges: state.hinges.map(h => ({
            ...h,
            side: h.side === "LEFT" ? "RIGHT" : "LEFT",
          }))
        }));

        const state = get();
        const minLeft = getMinBorder(state.hingeDrilling, state.hinges, "LEFT");
        const minRight = getMinBorder(state.hingeDrilling, state.hinges, "RIGHT");

        if (state.leftStile < minLeft) set({ leftStile: minLeft });
        if (state.rightStile < minRight) set({ rightStile: minRight });
      },


      equaliseHinges: () => {
        const state = get();
        if (state.hinges.length < 2) return;

        // Determine if hinge side has an angled cutout
        const hingeSide = state.hinges[0]?.side || "LEFT";
        let angleCutoutHeight = 0;
        if (hingeSide === "LEFT" && state.angledLeft) {
          angleCutoutHeight = state.leftTriangleCutoutHeight;
        } else if (hingeSide === "RIGHT" && state.angledRight) {
          angleCutoutHeight = state.rightTriangleCutoutHeight;
        }

        // Top offset must clear the angled zone (with a 50mm safety margin)
        const topOffset = angleCutoutHeight > 0
          ? Math.max(100, angleCutoutHeight + 50)
          : 100;
        const bottomOffset = 100;
        const count = state.hinges.length;

        if (count === 2) {
          const updatedHinges = [
            { ...state.hinges[0], positionMm: topOffset, reference: "TOP" as const },
            { ...state.hinges[1], positionMm: bottomOffset, reference: "BOTTOM" as const }
          ];
          set({ hinges: updatedHinges });
          return;
        }

        const useableHeight = state.height - topOffset - bottomOffset;
        const spacing = useableHeight / (count - 1);

        const updatedHinges = state.hinges.map((h, i) => {
          if (i === 0) return { ...h, positionMm: topOffset, reference: "TOP" as const };
          if (i === count - 1) return { ...h, positionMm: bottomOffset, reference: "BOTTOM" as const };
          // For middle hinges, reference from top
          return { ...h, positionMm: Math.round(topOffset + spacing * i), reference: "TOP" as const };
        });

        set({ hinges: updatedHinges });
      },

      setFinish: (finish: FinishType) => {
        get().clearNewSession();
        set({ finish });
        get().calculatePrice();
      },

      setViewSide: (viewSide: ViewSide) => {
        set({ viewSide });
      },

      toggleDimensions: () => {
        set((state) => ({ showDimensions: !state.showDimensions }));
      },

      calculatePrice: () => {
        const state = get();

        // New session: show £0.00 until user interacts
        if (state.isNewSession) {
          set({ price: 0 });
          return;
        }

        const result = calculateDoorPrice({
          ...state,
          leftStile: state.customBorders ? state.leftStile : state.borderWidth,
          rightStile: state.customBorders ? state.rightStile : state.borderWidth,
          topRail: state.customBorders ? state.topRail : state.borderWidth,
          bottomRail: state.customBorders ? state.bottomRail : state.borderWidth,
        });

        set({ price: result.unitTotal });
      },

      resetConfig: () => {
        set({ ...initialState, isNewSession: true });
      },

      setSelectedSection: (selectedSection: string) => {
        set({ selectedSection });
      },
    }),
    {
      name: "door-config-storage",
      storage: createJSONStorage(() => createResilientStorage()),
      version: 6,
      migrate: (persistedState: any, version: number) => {
        const migrated = persistedState || {};

        // Migration v1 -> v2: Remove PRIMED finish
        if (version < 2) {
          if (migrated.finish === "PRIMED") {
            migrated.finish = "RAW_UNASSEMBLED";
          }
        }

        // Migration v2 -> v3: Ensure all fields exist with defaults
        if (version < 3) {
          if (!Array.isArray(migrated.midRails)) {
            migrated.midRails = [];
          }
          if (!Array.isArray(migrated.hinges)) {
            migrated.hinges = [];
          }
          if (typeof migrated.leftAngledRailWidth !== 'number' || isNaN(migrated.leftAngledRailWidth)) {
            migrated.leftAngledRailWidth = initialState.leftAngledRailWidth;
          }
          if (typeof migrated.rightAngledRailWidth !== 'number' || isNaN(migrated.rightAngledRailWidth)) {
            migrated.rightAngledRailWidth = initialState.rightAngledRailWidth;
          }
          if (migrated.angledRailWidth !== undefined) {
            migrated.leftAngledRailWidth = migrated.angledRailWidth;
            migrated.rightAngledRailWidth = migrated.angledRailWidth;
            delete migrated.angledRailWidth;
          }
          if (typeof migrated.rebateWidthMm !== 'number' || isNaN(migrated.rebateWidthMm)) {
            migrated.rebateWidthMm = initialState.rebateWidthMm;
          }
          if (typeof migrated.rebateDepthMm !== 'number' || isNaN(migrated.rebateDepthMm)) {
            migrated.rebateDepthMm = initialState.rebateDepthMm;
          }
          if (typeof migrated.frontFaceThicknessMm !== 'number' || isNaN(migrated.frontFaceThicknessMm)) {
            migrated.frontFaceThicknessMm = initialState.frontFaceThicknessMm;
          }
          if (typeof migrated.cornerRadiusMm !== 'number' || isNaN(migrated.cornerRadiusMm)) {
            migrated.cornerRadiusMm = initialState.cornerRadiusMm;
          }
        }

        // Migration v3 -> v4: Remove angle preset fields
        if (version < 4) {
          delete migrated.leftAnglePreset;
          delete migrated.rightAnglePreset;
        }

        // Migration v4 -> v5: Add _hasInteracted flag
        if (version < 5) {
          // If they had data from v4, they are a returning user
          migrated._hasInteracted = true;
        }

        // Migration v5 -> v6: Update Hinge interface to T/B notation
        if (version < 6) {
          if (Array.isArray(migrated.hinges)) {
            migrated.hinges = migrated.hinges.map((h: any) => {
              if (h.positionFromBottomMm !== undefined) {
                h.positionMm = h.positionFromBottomMm;
                h.reference = h.positionFromBottomMm > (migrated.height || 720) / 2 ? "TOP" : "BOTTOM";
                if (h.reference === "TOP") {
                  h.positionMm = (migrated.height || 720) - h.positionFromBottomMm;
                }
                delete h.positionFromBottomMm;
              }
              return h;
            });
          }
        }

        return migrated as DoorConfigStore;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state._hasInteracted) {
            // Returning user — restore config and recalculate price
            state.isNewSession = false;
            setTimeout(() => useDoorConfig.getState().calculatePrice(), 0);
          } else {
            // Genuinely new user — show placeholder with £0.00
            state.isNewSession = true;
            state.price = 0;
          }
        }
      },
    }
  )
);

// No auto-calculate on load — price starts at £0.00 for new sessions