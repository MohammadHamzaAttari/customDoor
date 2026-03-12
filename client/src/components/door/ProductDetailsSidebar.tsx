import { useState } from "react";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Check,
  Package,
  Plus,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function ProductDetailsSidebar() {
  const [, setLocation] = useLocation();
  const config = useDoorConfig();
  const { addDoor, doors } = useDoorStore();

  const {
    width,
    height,
    thickness,
    panelType,
    panelCount,
    panelOrientation,
    finish,
    price,
    angledLeft,
    angledRight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    borderWidth,
    customBorders,
    leftStile,
    rightStile,
    topRail,
    bottomRail,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    hingeDrilling,
    hinges,
    showDimensions,
    isNewSession,
    editingCartItemId,
    leftAngledRailWidth,
    rightAngledRailWidth,
  } = config;

  const cartCount = doors.reduce((sum: number, d: any) => sum + d.qty, 0);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const panelLabels: Record<string, string> = {
    STANDARD_12MM: "Standard 12mm",
    STANDARD_9MM: "Standard 9mm",
    REEDED_19MM: "Reeded 19mm",
    MELAMINE_18MM: "Melamine 18mm",
    NONE: "Slab (No Panel)",
    FRETWORK: "Fretwork Pattern",
    GLASS: "Glass Ready",
  };

  const finishLabels: Record<string, { label: string; color: string }> = {
    RAW_UNASSEMBLED: {
      label: "Raw Unassembled",
      color: "bg-stone-100 text-stone-700",
    },
    ASSEMBLED_PREP: {
      label: "Assembled & Prepped",
      color: "bg-stone-200 text-stone-800",
    },
    PRIMED: {
      label: "Primed",
      color: "bg-emerald-100 text-emerald-700",
    },
    PAINTED: {
      label: "Painted",
      color: "bg-blue-100 text-blue-700",
    },
  };

  const currentFinish = finishLabels[finish] || finishLabels.RAW_UNASSEMBLED;

  // Build features list
  const features: { label: string; value: string; highlight?: boolean }[] = [];

  if (width > 0 && height > 0) {
    features.push({
      label: "Dimensions",
      value: `${width} × ${height} × ${thickness}mm`,
    });
  }

  if (panelType !== "UNSELECTED") {
    features.push({
      label: "Panel Type",
      value: panelLabels[panelType] || panelType,
    });
  }

  if (angledLeft) {
    features.push({
      label: "Left Angle",
      value: `${(leftAngleDegrees || 0).toFixed(2)}°`,
      highlight: true,
    });
  }

  if (angledRight) {
    features.push({
      label: "Right Angle",
      value: `${(rightAngleDegrees || 0).toFixed(2)}°`,
      highlight: true,
    });
  }

  if (angledLeft || angledRight) {
    features.push({
      label: "Angled Rails",
      value: `L: ${Number(leftAngledRailWidth || 0).toFixed(1)}mm | R: ${Number(rightAngledRailWidth || 0).toFixed(1)}mm`,
      highlight: true,
    });
  }

  if (panelType !== "NONE" && midRailsEnabled && midRails.length > 0) {
    features.push({
      label: "Mid Rails",
      value: `${midRails.length} rail${midRails.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }

  if (hingeDrilling && hinges.length > 0) {
    features.push({
      label: "Hinge Holes",
      value: `${hinges.length} hole${hinges.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }

  if (panelType !== "NONE") {
    if (rebateWidthMm > 0 || rebateDepthMm > 0) {
      features.push({
        label: "Rebate",
        value: `${rebateWidthMm}w × ${rebateDepthMm}d mm`,
      });
    }
    if (frontFaceThicknessMm > 0) {
      features.push({
        label: "Front Face",
        value: `${frontFaceThicknessMm}mm`,
      });
    }
    if (cornerRadiusMm > 0 || rearCornerRadiusMm > 0) {
      features.push({
        label: "Radii (F/R)",
        value: `R${cornerRadiusMm} / R${rearCornerRadiusMm}`,
      });
    }
  }

  const buildDoorData = () => ({
    id: editingCartItemId || undefined,
    qty: quantity,
    width,
    height,
    thickness,
    panelCount,
    panelOrientation: panelOrientation || "vertical",
    shape: ((angledLeft || angledRight) ? "angled" : "rectangular") as "angled" | "rectangular",
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftAngledRailWidth,
    rightAngledRailWidth,
    borderWidth,
    customBorders,
    leftStile: customBorders ? leftStile : borderWidth,
    rightStile: customBorders ? rightStile : borderWidth,
    bottomRail: customBorders ? bottomRail : borderWidth,
    topRail: customBorders ? topRail : borderWidth,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise: midRailsEqualise || false,
    midRails: midRailsEnabled ? midRails : [],
    hingeDrilling,
    hinges: hingeDrilling ? hinges : [],
    material: "MDF",
    finish,
    showDimensions,
  });

  const handleAddToCart = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 2000);

    const newTotal = editingCartItemId ? cartCount : cartCount + 1;

    toast.success(
      editingCartItemId ? "Updated cart!" : "Added to cart!",
      {
        description: `${width}×${height}mm door — £${(price || 0).toFixed(2)}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
        action: {
          label: "Review Cart",
          onClick: () => setLocation("/checkout"),
        },
      }
    );
  };

  const handleAddAndCheckout = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    toast.success(
      editingCartItemId
        ? "Updated cart! Redirecting…"
        : "Added to cart! Redirecting…",
      {
        description: `${width}×${height}mm door — £${(price || 0).toFixed(2)}`,
      }
    );

    setTimeout(() => setLocation("/checkout"), 150);
  };

  const handleViewCart = () => {
    setLocation("/checkout");
  };

  const orderSubtotal = doors.reduce(
    (sum: number, d: any) => sum + d.lineTotal,
    0
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-gradient-to-b from-white to-stone-50/50">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Trade Shaker Door
            </h2>
            <p className="text-[13px] text-stone-500 mt-0.5 font-medium">
              Custom MDF Door
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className={cn(
                "text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5",
                currentFinish.color
              )}
            >
              {currentFinish.label}
            </Badge>
            {editingCartItemId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider border-stone-200 text-stone-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 rounded-lg transition-all duration-200"
                onClick={() => {
                  config.resetConfig();
                  useDoorStore.getState().setActiveDoor(null);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Door
              </Button>
            )}
          </div>
        </div>

        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-stone-800 via-stone-900 to-black shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(199,91,51,0.3)] hover:-translate-y-0.5">
          {/* Animated border shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 rounded-[15px] p-5 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-[30px] pointer-events-none" />
            <p className="text-stone-400 text-[10px] uppercase tracking-widest font-black mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
              Unit Price
            </p>
            <div className="flex items-baseline relative z-10">
              <span className="text-lg mr-1 text-orange-400 font-bold">£</span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-stone-400 tracking-tight tabular-nums drop-shadow-sm pb-1">
                {isNewSession ? "0.00" : (price || 0).toFixed(2)}
              </span>
            </div>
            {isNewSession && (
              <p className="text-[11px] text-orange-200/60 mt-2.5 font-medium flex items-center gap-1.5 animate-pulse-soft">
                Configure your door to see the price
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 scrollbar-autohide">
        <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Specifications
        </h3>

        <div className="space-y-2 stagger-in w-full">
          {features.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex justify-between items-center py-2.5 px-3.5 rounded-xl text-[12px] transition-all duration-300",
                f.highlight
                  ? "bg-gradient-to-r from-orange-50 to-orange-100/50 text-orange-900 border border-orange-200/60 shadow-[0_2px_8px_-2px_rgba(199,91,51,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(199,91,51,0.15)] hover:-translate-y-0.5"
                  : "bg-white text-stone-700 border border-stone-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] hover:-translate-y-0.5"
              )}
            >
              <span className="text-stone-500 font-semibold tracking-wide truncate mr-2 flex items-center gap-1.5">
                {f.highlight && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                {f.label}
              </span>
              <span className="font-extrabold text-right tabular-nums bg-stone-50 px-2 py-0.5 rounded-md border border-stone-100">{f.value}</span>
            </div>
          ))}
        </div>

        <Separator className="my-6 bg-stone-200/60" />

        {cartCount > 0 && (
          <button
            onClick={handleViewCart}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-xl hover:border-orange-300 transition-all duration-300 shadow-[0_4px_15px_-3px_rgba(199,91,51,0.1)] hover:shadow-[0_8px_25px_-5px_rgba(199,91,51,0.2)] hover:-translate-y-0.5 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
            <div className="relative z-10 flex flex-col items-start">
              <p className="text-[13px] font-black text-orange-900 tracking-tight">
                {cartCount} item{cartCount > 1 ? "s" : ""} in cart
              </p>
              <p className="text-[11px] text-orange-600/80 font-bold mt-0.5">
                Subtotal: £{orderSubtotal.toFixed(2)}
              </p>
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300">
              <ExternalLink className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors duration-300 translate-x-px -translate-y-px" />
            </div>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-stone-100 bg-white space-y-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="flex gap-2">
          {!editingCartItemId && (
            <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden h-14 shrink-0 shadow-inner">
              <button
                className="px-4 hover:bg-stone-200 text-stone-600 h-full flex items-center justify-center font-bold text-lg transition-colors active:bg-stone-300"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <div className="px-1 font-bold w-6 text-center text-[15px] tabular-nums">
                {quantity}
              </div>
              <button
                className="px-4 hover:bg-stone-200 text-stone-600 h-full flex items-center justify-center font-bold text-lg transition-colors active:bg-stone-300"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          )}
          <Button
            className={cn(
              "flex-1 h-14 rounded-xl font-extrabold text-[15px] shadow-lg transition-all duration-300 hover:-translate-y-0.5 btn-press relative overflow-hidden group",
              justAdded
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-600/30 hover:shadow-orange-600/40"
            )}
            onClick={handleAddToCart}
            disabled={
              width < 200 ||
              height < 200 ||
              panelType === "UNSELECTED"
            }
          >
            {!justAdded && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
            )}
            <div className="relative z-10 flex items-center justify-center">
              {justAdded ? (
                <>
                  <Check className="w-5 h-5 mr-2 stroke-[3]" />
                  {editingCartItemId ? "Saved!" : "Added!"}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2 stroke-[2.5]" />
                  {width < 200 || height < 200
                    ? "Set Dimensions"
                    : panelType === "UNSELECTED"
                      ? "Select Panel"
                      : editingCartItemId
                        ? "Save Changes"
                        : "Add to Cart"}
                </>
              )}
            </div>
          </Button>
        </div>

        {cartCount > 0 && (
          <Button
            variant="outline"
            onClick={handleViewCart}
            className="w-full h-14 rounded-xl font-bold text-stone-700 border-2 border-stone-200 hover:border-orange-200 hover:text-orange-700 hover:bg-orange-50 transition-all duration-300 btn-press"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Review Cart
            <Badge className="ml-2 bg-orange-100 text-orange-700 border-0 text-[10px] font-bold px-1.5">
              {cartCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// MOBILE CART BAR
// ============================================

export function MobileCartBar() {
  const [, setLocation] = useLocation();
  const { doors, activeDoorId, addDoor } = useDoorStore();
  const {
    price,
    width,
    height,
    thickness,
    panelType,
    panelCount,
    panelOrientation,
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftAngledRailWidth,
    rightAngledRailWidth,
    borderWidth,
    customBorders,
    leftStile,
    rightStile,
    bottomRail,
    topRail,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    hingeDrilling,
    hinges,
    finish,
    showDimensions,
    editingCartItemId,
  } = useDoorConfig();

  const [justAdded, setJustAdded] = useState(false);

  const cartCount = doors.reduce((total, item) => total + item.qty, 0);

  const buildDoorData = () => ({
    id: editingCartItemId || undefined,
    qty: 1,
    width,
    height,
    panelType,
    panelCount,
    panelOrientation: panelOrientation || "vertical",
    shape: ((angledLeft || angledRight) ? "angled" : "rectangular") as "angled" | "rectangular",
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftAngledRailWidth,
    rightAngledRailWidth,
    borderWidth,
    customBorders,
    leftStile: customBorders ? leftStile : borderWidth,
    rightStile: customBorders ? rightStile : borderWidth,
    bottomRail: customBorders ? bottomRail : borderWidth,
    topRail: customBorders ? topRail : borderWidth,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise: midRailsEqualise || false,
    midRails: midRailsEnabled ? midRails : [],
    hingeDrilling,
    hinges: hingeDrilling ? hinges : [],
    material: "MDF",
    finish,
    showDimensions,
  });

  const handleAddToCart = () => {
    const doorData = buildDoorData();
    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);

    const newTotal = editingCartItemId ? cartCount : cartCount + 1;
    toast.success(editingCartItemId ? "Updated cart!" : "Added to cart!", {
      description: `${width}×${height}mm door — £${(price || 0).toFixed(2)}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
      action: {
        label: "Review Cart",
        onClick: () => setLocation("/checkout"),
      },
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 pb-safe border-t border-stone-200 bg-white/95 backdrop-blur-xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-3 animate-in-up">
      <div
        className="flex flex-col shrink-0"
        onClick={() => cartCount > 0 ? setLocation("/checkout") : undefined}
        role={cartCount > 0 ? "button" : undefined}
      >
        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5 ml-1">
          Unit Price
        </span>
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-100 rounded-lg shrink-0 w-max">
          <ShoppingCart className="w-4 h-4 text-orange-600" />
          <span className="text-lg font-black text-stone-900 leading-none tabular-nums">
            £{(price || 0).toFixed(2)}
          </span>
          {cartCount > 0 && (
            <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      <Button
        className={cn(
          "flex-1 h-[48px] rounded-xl font-extrabold text-[14px] shadow-lg transition-all duration-300 hover:-translate-y-0.5 btn-press relative overflow-hidden group",
          justAdded
            ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
            : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-600/30"
        )}
        onClick={handleAddToCart}
        disabled={
          width < 200 ||
          height < 200 ||
          panelType === "UNSELECTED"
        }
      >
        {!justAdded && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
        )}
        <div className="relative z-10 flex items-center justify-center">
          {justAdded ? (
            <>
              <Check className="w-4 h-4 mr-2 stroke-[3]" />
              {editingCartItemId ? "Saved!" : "Added!"}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              {editingCartItemId ? "Update Cart" : "Add to Cart"}
            </>
          )}
        </div>
      </Button>
    </div>
  );
}