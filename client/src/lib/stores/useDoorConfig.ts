// client/src/lib/stores/useDoorConfig.ts
import { create } from "zustand";
import { getPresetById, calculateAngleFromCutout } from "../anglePresets";
import { calculateDoorPrice, DEFAULT_PRICING } from "@shared/doorSchema";

export type DoorPreset = "single" | "double" | "shaker_2" | "shaker_4" | "shaker_6" | "panel_3" | "panel_4" | "panel_6";
export type PanelType = "STANDARD_12MM" | "REEDED_19MM" | "MELAMINE_18MM" | "FRETWORK" | "GLASS" | "NONE";
export type PanelOrientation = "vertical" | "horizontal";
export type BorderStyle = "none" | "simple" | "detailed";
export type DoorShape = "rectangular" | "angled";
export type MaterialType = "MDF";
export type FinishType = "RAW_UNASSEMBLED" | "ASSEMBLED_PREP" | "PRIMED";
export type HingeType = "SCREW_POINTS" | "INSERTA";
export type AnglePresetId = "under-stair-standard" | "under-stair-gentle" | "loft-access" | "corner-unit" | "steep-attic" | "custom";

// Hinge center offset: 5mm gap to edge + 17.5mm (half of 35mm cup) = 22.5mm
export const HINGE_CENTER_OFFSET_MM = 22.5;
export const HINGE_CUP_DIAMETER_MM = 35;
export const HINGE_CUP_DEPTH_MM = 13;

// Border minimums per requirements
export const MIN_BORDER_WITH_HINGES = 65;
export const MIN_BORDER_WITHOUT_HINGES = 35;

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
  leftAnglePreset: AnglePresetId;
  rightAnglePreset: AnglePresetId;
  leftTriangleCutoutWidth: number;
  leftTriangleCutoutHeight: number;
  rightTriangleCutoutWidth: number;
  rightTriangleCutoutHeight: number;
  leftAngleDegrees: number;
  rightAngleDegrees: number;

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
  price: number;
  selectedSection: string;
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
  setLeftAnglePreset: (presetId: AnglePresetId) => void;
  setRightAnglePreset: (presetId: AnglePresetId) => void;
  setLeftTriangleCutoutWidth: (width: number) => void;
  setLeftTriangleCutoutHeight: (height: number) => void;
  setRightTriangleCutoutWidth: (width: number) => void;
  setRightTriangleCutoutHeight: (height: number) => void;
  applyAnglePreset: (side: "left" | "right", presetId: AnglePresetId) => void;

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

  setMidRailsEnabled: (enabled: boolean) => void;
  setMidRailsEqualise: (enabled: boolean) => void;
  addMidRail: () => void;
  removeMidRail: (id: string) => void;
  updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => void;

  setHingeDrilling: (enabled: boolean) => void;
  addHinge: () => void;
  removeHinge: (id: string) => void;
  updateHinge: (id: string, field: keyof Hinge, value: any) => void;
  swapHingeSide: () => void;

  setFinish: (finish: FinishType) => void;
  toggleDimensions: () => void;
  calculatePrice: () => void;
  resetConfig: () => void;
  setSelectedSection: (section: string) => void;

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
  leftAnglePreset: "under-stair-standard",
  rightAnglePreset: "under-stair-standard",
  leftTriangleCutoutWidth: 180,
  leftTriangleCutoutHeight: 400,
  rightTriangleCutoutWidth: 180,
  rightTriangleCutoutHeight: 400,
  leftAngleDegrees: 42,
  rightAngleDegrees: 42,

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
  price: 0,
  selectedSection: "dimensions",
};

let midRailIdCounter = 0;
let hingeIdCounter = 0;

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

export const useDoorConfig = create<DoorConfigStore>((set, get) => ({
  ...initialState,

  getMinBorderForSide: (side: "LEFT" | "RIGHT" | "TOP" | "BOTTOM") => {
    const state = get();
    return getMinBorder(state.hingeDrilling, state.hinges, side);
  },

  setWidth: (width: number) => {
    set({ width });
    const state = get();
    if (state.angledLeft && state.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", state.leftAnglePreset);
    }
    if (state.angledRight && state.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", state.rightAnglePreset);
    }
    get().calculatePrice();
  },

  setHeight: (height: number) => {
    set({ height });
    const state = get();
    if (state.angledLeft && state.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", state.leftAnglePreset);
    }
    if (state.angledRight && state.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", state.rightAnglePreset);
    }
    get().calculatePrice();
  },

  setThickness: (thickness: 22 | 18) => {
    const state = get();
    // RULE: 18mm only for slab doors
    if (thickness === 18 && state.panelType !== "NONE") {
      // Auto-switch to slab when selecting 18mm
      set({ thickness, panelType: "NONE" });
    } else {
      set({ thickness });
    }
    get().calculatePrice();
  },

  setPreset: (preset: DoorPreset) => {
    set({ preset });
    get().calculatePrice();
  },

  setPanelType: (panelType: PanelType) => {
    const state = get();
    // RULE: 18mm only allows NONE (slab)
    if (state.thickness === 18 && panelType !== "NONE") {
      // Auto-switch to 22mm when selecting a panel type
      set({ panelType, thickness: 22 });
    } else if (panelType === "NONE") {
      // Switching to slab — thickness can be 18 or 22
      set({ panelType });
    } else {
      // RULE: Reeded and melamine only for 22mm
      if ((panelType === "REEDED_19MM" || panelType === "MELAMINE_18MM") && state.thickness !== 22) {
        set({ panelType, thickness: 22 });
      } else {
        set({ panelType });
      }
    }
    get().calculatePrice();
  },

  setPanelCount: (panelCount: number) => {
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
    set({ angledLeft });
    if (angledLeft) {
      get().applyAnglePreset("left", get().leftAnglePreset);
    }
    get().calculatePrice();
  },

  setAngledRight: (angledRight: boolean) => {
    set({ angledRight });
    if (angledRight) {
      get().applyAnglePreset("right", get().rightAnglePreset);
    }
    get().calculatePrice();
  },

  setLeftAnglePreset: (presetId: AnglePresetId) => {
    set({ leftAnglePreset: presetId });
    if (presetId !== "custom") {
      get().applyAnglePreset("left", presetId);
    }
  },

  setRightAnglePreset: (presetId: AnglePresetId) => {
    set({ rightAnglePreset: presetId });
    if (presetId !== "custom") {
      get().applyAnglePreset("right", presetId);
    }
  },

  applyAnglePreset: (side: "left" | "right", presetId: AnglePresetId) => {
    const state = get();
    const preset = getPresetById(presetId);
    if (!preset || presetId === "custom") return;

    const cutout = preset.calculateCutout(state.width, state.height, state.borderWidth);
    const angle = calculateAngleFromCutout(cutout.width, cutout.height);

    if (side === "left") {
      set({
        leftTriangleCutoutWidth: cutout.width,
        leftTriangleCutoutHeight: cutout.height,
        leftAngleDegrees: angle,
      });
    } else {
      set({
        rightTriangleCutoutWidth: cutout.width,
        rightTriangleCutoutHeight: cutout.height,
        rightAngleDegrees: angle,
      });
    }
  },

  setLeftTriangleCutoutWidth: (width: number) => {
    const state = get();
    set({
      leftTriangleCutoutWidth: width,
      leftAnglePreset: "custom",
      leftAngleDegrees: calculateAngleFromCutout(width, state.leftTriangleCutoutHeight),
    });
  },

  setLeftTriangleCutoutHeight: (height: number) => {
    const state = get();
    set({
      leftTriangleCutoutHeight: height,
      leftAnglePreset: "custom",
      leftAngleDegrees: calculateAngleFromCutout(state.leftTriangleCutoutWidth, height),
    });
  },

  setRightTriangleCutoutWidth: (width: number) => {
    const state = get();
    set({
      rightTriangleCutoutWidth: width,
      rightAnglePreset: "custom",
      rightAngleDegrees: calculateAngleFromCutout(width, state.rightTriangleCutoutHeight),
    });
  },

  setRightTriangleCutoutHeight: (height: number) => {
    const state = get();
    set({
      rightTriangleCutoutHeight: height,
      rightAnglePreset: "custom",
      rightAngleDegrees: calculateAngleFromCutout(state.rightTriangleCutoutWidth, height),
    });
  },

  setBorderWidth: (borderWidth: number) => {
    const state = get();
    const minLeft = getMinBorder(state.hingeDrilling, state.hinges, "LEFT");
    const minRight = getMinBorder(state.hingeDrilling, state.hinges, "RIGHT");
    const minTop = MIN_BORDER_WITHOUT_HINGES;
    const minBottom = MIN_BORDER_WITHOUT_HINGES;

    const clamped = Math.max(borderWidth, Math.max(minLeft, minRight, minTop, minBottom));

    set({
      borderWidth,
      leftStile: borderWidth,
      rightStile: borderWidth,
      bottomRail: borderWidth,
      topRail: borderWidth,
    });

    const s = get();
    if (s.angledLeft && s.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", s.leftAnglePreset);
    }
    if (s.angledRight && s.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", s.rightAnglePreset);
    }
  },

  setCustomBorders: (customBorders: boolean) => {
    const state = get();
    if (!customBorders) {
      const minLeft = getMinBorder(state.hingeDrilling, state.hinges, "LEFT");
      const minRight = getMinBorder(state.hingeDrilling, state.hinges, "RIGHT");
      set({
        customBorders,
        leftStile: state.borderWidth,
        rightStile: state.borderWidth,
        bottomRail: state.borderWidth,
        topRail: state.borderWidth,
      });
    } else {
      set({ customBorders });
    }
  },

  setLeftStile: (leftStile: number) => {
    set({ leftStile });
  },

  setRightStile: (rightStile: number) => {
    set({ rightStile });
  },

  setBottomRail: (bottomRail: number) => {
    set({ bottomRail });
  },

  setTopRail: (topRail: number) => {
    set({ topRail });
  },

  setRebateWidth: (rebateWidthMm: number) => set({ rebateWidthMm }),
  setRebateDepth: (rebateDepthMm: number) => set({ rebateDepthMm }),
  setFrontFaceThickness: (frontFaceThicknessMm: number) => set({ frontFaceThicknessMm }),
  setCornerRadius: (cornerRadiusMm: number) => set({ cornerRadiusMm }),

  setMidRailsEnabled: (midRailsEnabled: boolean) => {
    set({ midRailsEnabled });
    if (midRailsEnabled && get().midRails.length === 0) {
      get().addMidRail();
    }
    get().calculatePrice();
  },

  setMidRailsEqualise: (midRailsEqualise: boolean) => {
    const state = get();
    if (midRailsEqualise && state.midRails.length > 0) {
      const railCount = state.midRails.length;
      const usableHeight = state.height - state.bottomRail - state.topRail;
      const spacing = usableHeight / (railCount + 1);

      const updatedRails = state.midRails.map((rail, index) => ({
        ...rail,
        positionFromBottom: Math.round(state.bottomRail + spacing * (index + 1)),
      }));

      set({ midRailsEqualise, midRails: updatedRails });
    } else {
      set({ midRailsEqualise });
    }
  },

  addMidRail: () => {
    const state = get();
    const newRail: MidRail = {
      id: `rail_${++midRailIdCounter}`,
      positionFromBottom: Math.round(state.height / 2),
      dimension: state.borderWidth,
    };
    set({ midRails: [...state.midRails, newRail] });
    get().calculatePrice();
  },

  removeMidRail: (id: string) => {
    set((state) => ({
      midRails: state.midRails.filter(rail => rail.id !== id)
    }));
    get().calculatePrice();
  },

  updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => {
    // Enforce minimum dimension of 35mm
    const clampedValue = field === 'dimension' ? Math.max(35, value) : value;
    set((state) => ({
      midRails: state.midRails.map(rail =>
        rail.id === id ? { ...rail, [field]: clampedValue } : rail
      )
    }));
  },

  setHingeDrilling: (hingeDrilling: boolean) => {
    set({ hingeDrilling });
    if (hingeDrilling && get().hinges.length === 0) {
      const state = get();
      const h1: Hinge = { id: `hinge_${++hingeIdCounter}`, positionFromBottomMm: 100, side: "LEFT", type: "SCREW_POINTS" };
      const h2: Hinge = { id: `hinge_${++hingeIdCounter}`, positionFromBottomMm: state.height - 100, side: "LEFT", type: "SCREW_POINTS" };
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

  addHinge: () => {
    const state = get();
    const existingSide = state.hinges.length > 0 ? state.hinges[0].side : "LEFT";
    const existingType = state.hinges.length > 0 ? state.hinges[0].type : "SCREW_POINTS";
    const newHinge: Hinge = {
      id: `hinge_${++hingeIdCounter}`,
      positionFromBottomMm: Math.round(state.height / 2),
      side: existingSide,
      type: existingType,
    };
    set({ hinges: [...state.hinges, newHinge] });
    get().calculatePrice();
  },

  removeHinge: (id: string) => {
    set((state) => ({
      hinges: state.hinges.filter(h => h.id !== id)
    }));
    get().calculatePrice();
  },

  updateHinge: (id: string, field: keyof Hinge, value: any) => {
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

  /**
   * Quick swap all hinges from LEFT↔RIGHT (catalogue mode requirement)
   */
  swapHingeSide: () => {
    set((state) => ({
      hinges: state.hinges.map(h => ({
        ...h,
        side: h.side === "LEFT" ? "RIGHT" : "LEFT",
      }))
    }));

    // Re-enforce border minimums after swap
    const state = get();
    const minLeft = getMinBorder(state.hingeDrilling, state.hinges, "LEFT");
    const minRight = getMinBorder(state.hingeDrilling, state.hinges, "RIGHT");

    if (state.leftStile < minLeft) set({ leftStile: minLeft });
    if (state.rightStile < minRight) set({ rightStile: minRight });
  },

  setFinish: (finish: FinishType) => {
    set({ finish });
    get().calculatePrice();
  },

  toggleDimensions: () => {
    set((state) => ({ showDimensions: !state.showDimensions }));
  },

  calculatePrice: () => {
    const state = get();

    const result = calculateDoorPrice({
      ...state,
      // Ensure we pass the effective border values
      leftStile: state.customBorders ? state.leftStile : state.borderWidth,
      rightStile: state.customBorders ? state.rightStile : state.borderWidth,
      topRail: state.customBorders ? state.topRail : state.borderWidth,
      bottomRail: state.customBorders ? state.bottomRail : state.borderWidth,
    });

    set({ price: result.unitTotal });
  },

  resetConfig: () => {
    set(initialState);
    get().calculatePrice();
  },

  setSelectedSection: (selectedSection: string) => {
    set({ selectedSection });
  },
}));

// Initialize price on load
setTimeout(() => {
  useDoorConfig.getState().calculatePrice();
}, 0);