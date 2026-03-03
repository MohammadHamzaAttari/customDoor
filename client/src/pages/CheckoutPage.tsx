// client/src/pages/CheckoutPage.tsx
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Lock, CreditCard, Loader2, Package, Ruler,
  Layers, Settings2, Check, Plus, Minus, Trash2, ShoppingCart, AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDoorStore, type DoorOrderItem } from "@/lib/stores/useDoorStore";
import { DEFAULT_PRICING, cartItemSchema } from "@shared/doorSchema";
import { z } from "zod";
import { Door2D } from "@/components/door/Door2D";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";

// ─── Constants ────────────────────────────────────────────────────────────────
const PANEL_LABELS: Record<string, string> = {
  STANDARD_12MM: "Standard 12mm",
  STANDARD_9MM: "Standard 9mm",
  REEDED_19MM: "Reeded 19mm",
  MELAMINE_18MM: "Melamine 18mm",
  NONE: "Slab (No Panel)",
  FRETWORK: "Fretwork Pattern",
  GLASS: "Glass Ready",
};

const FINISH_LABELS: Record<string, { label: string; color: string }> = {
  RAW_UNASSEMBLED: { label: "Raw Unassembled", color: "bg-stone-100 text-stone-700" },
  ASSEMBLED_PREP: { label: "Assembled & Prepped", color: "bg-stone-200 text-stone-800" },
  PRIMED: { label: "Primed", color: "bg-emerald-100 text-emerald-700" },
  PAINTED: { label: "Painted", color: "bg-blue-100 text-blue-700" },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  shaker: { label: "Shaker Door", icon: "🚪" },
  slab: { label: "Slab Door", icon: "📐" },
  glass: { label: "Glass Door", icon: "🪟" },
  cabinet: { label: "Cabinet Door", icon: "🗄️" },
  drawer: { label: "Drawer Front", icon: "🗃️" },
  custom: { label: "Custom Door", icon: "⚙️" },
};

// ─── Cart Item Card ───────────────────────────────────────────────────────────
function CartItemCard({
  item,
  index,
  onQuantityChange,
  onRemove,
  onSwapHinge,
  onFinishChange,
  onEdit,
}: {
  item: DoorOrderItem;
  index: number;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSwapHinge: (id: string) => void;
  onFinishChange: (id: string, finish: DoorOrderItem["finish"]) => void;
  onEdit: (item: DoorOrderItem) => void;
}) {
  const currentFinish = FINISH_LABELS[item.finish] || FINISH_LABELS.RAW_UNASSEMBLED;
  const areaM2 = (item.width * item.height) / 1_000_000;
  const category = item.panelType === "NONE" ? "slab" : "shaker";
  const categoryInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.custom;

  const hasCustomOptions =
    item.angledLeft ||
    item.angledRight ||
    (item.midRailsEnabled && item.midRails?.length) ||
    (item.hingeDrilling && item.hinges?.length);

  // Determine hinge side
  const hingeSide = item.hinges.length > 0 ? item.hinges[0].side : null;

  return (
    <Card className="border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-stone-50 to-stone-100 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Item {index + 1} — {categoryInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-500 hover:text-orange-600 hover:bg-orange-50 h-8 px-2"
            onClick={() => onEdit(item)}
          >
            <Settings2 className="w-4 h-4 mr-1" />
            <span className="text-xs">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-red-600 hover:bg-red-50 h-8 px-2"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="text-xs">Remove</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Render the 2D map side-by-side on desktop */}
        <div className="w-full md:w-56 shrink-0 bg-stone-50 p-3 border-r flex items-center justify-center">
          <div className="w-full aspect-[3/4]" data-door-id={item.id}>
            <Door2D face="front" configOverride={{ ...item, showDimensions: false } as any} />
          </div>
        </div>

        <div className="flex-1">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="w-5 h-5 text-orange-600" />
                  {item.label}
                </CardTitle>
                <CardDescription className="mt-1">Made-to-order premium door</CardDescription>
              </div>
              <Badge className={cn("text-xs font-medium", currentFinish.color)}>
                {currentFinish.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pb-4">
            {/* Quantity + Line Price */}
            <div className="flex items-center justify-between p-3 bg-orange-50/60 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-stone-700">Qty</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-stone-300"
                    onClick={() => onQuantityChange(item.id, Math.max(1, item.qty - 1))}
                    disabled={item.qty <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-lg font-bold w-8 text-center tabular-nums">{item.qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => onQuantityChange(item.id, item.qty + 1)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">£{item.unitPrice.toFixed(2)} each</p>
                <p className="text-lg font-bold text-stone-900">£{item.lineTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-stone-400" />
                Dimensions
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Height", value: `${item.height}mm` },
                  { label: "Width", value: `${item.width}mm` },
                  { label: "Thickness", value: `${item.thickness}mm` },
                ].map((d) => (
                  <div key={d.label} className="bg-stone-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">{d.label}</p>
                    <p className="text-lg font-bold text-stone-900">{d.value}</p>
                  </div>
                ))}
              </div>

            </div>

            <Separator />

            {/* Quick Actions — Catalogue Mode (per spec requirements) */}
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-stone-400" />
                Quick Edit
              </h3>
              <div className="space-y-3">
                {/* Finish Quick Change */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Finish</span>
                  <div className="flex gap-1">
                    {(["RAW_UNASSEMBLED", "ASSEMBLED_PREP", "PRIMED", "PAINTED"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => onFinishChange(item.id, f)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md border transition-all",
                          item.finish === f
                            ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                            : "border-stone-200 text-stone-500 hover:border-orange-300"
                        )}
                      >
                        {FINISH_LABELS[f].label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hinge Side Quick Swap */}
                {item.hingeDrilling && item.hinges.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Hinges: {hingeSide}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSwapHinge(item.id)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 h-7 text-xs"
                    >
                      <ArrowLeftRight className="w-3 h-3 mr-1" />
                      Swap Side
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-400" />
                Specifications
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-stone-600">Panel Type</span>
                  <span className="text-sm font-medium text-stone-900">
                    {PANEL_LABELS[item.panelType] || item.panelType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-stone-600">Finish Level</span>
                  <span className="text-sm font-medium text-stone-900 italic">
                    {currentFinish.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="py-2 px-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-stone-500 uppercase">Rebate</p>
                    <p className="text-sm font-medium text-stone-900">{item.rebateWidthMm}w × {item.rebateDepthMm}d mm</p>
                  </div>
                  <div className="py-2 px-3 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-stone-500 uppercase">Corner Rad.</p>
                    <p className="text-sm font-medium text-stone-900">F:R{item.cornerRadiusMm} / B:R{item.rearCornerRadiusMm}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Options */}
            {hasCustomOptions && (
              <div className="space-y-2">
                {item.angledLeft && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Left Angle
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {item.leftAngleDegrees}°
                    </span>
                  </div>
                )}
                {item.angledRight && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Right Angle
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {item.rightAngleDegrees}°
                    </span>
                  </div>
                )}
                {item.midRailsEnabled && item.midRails?.length > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Mid Rails
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {item.midRails.length} rail{item.midRails.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {item.hingeDrilling && item.hinges?.length > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Hinge Drilling
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {item.hinges.length} hole{item.hinges.length > 1 ? "s" : ""} ({item.hinges[0]?.type === "INSERTA" ? "Inserta" : "Screw"})
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const {
    doors,
    updateQuantity,
    removeDoor,
    duplicateDoor,
    swapHingeSide,
    updateFinish,
    resetStore,
    getTotalItems,
    getSubtotal,
    getVat,
    getGrandTotal,
  } = useDoorStore();

  const loadFromCartItem = useDoorConfig(state => state.loadFromCartItem);

  const [isLoading, setIsLoading] = useState(false);

  // ─── Restore Cart from Session Storage ───
  // Defined BEFORE any conditional returns to respect Rules of Hooks
  const restoreCartFromBackup = useCallback(() => {
    try {
      const backup = sessionStorage.getItem('checkout-backup');
      if (backup) {
        console.log("Found checkout backup, attempting restore...");
        let data;
        try {
          data = JSON.parse(backup);
        } catch (e) {
          console.error("Failed to parse backup JSON", e);
          sessionStorage.removeItem('checkout-backup');
          return;
        }

        // Only restore if backup is less than 24 hours old
        if (Date.now() - data.timestamp < 86400000) {
          if (data.doors && Array.isArray(data.doors)) {
            const validDoors = data.doors.filter((d: any) => {
              return d && typeof d === 'object' && d.id && typeof d.width === 'number';
            });

            if (validDoors.length > 0) {
              useDoorStore.getState().restoreState(validDoors);
              toast.success("Cart restored", {
                description: "Your previous session has been recovered."
              });
              // Clear backup after successful restore to prevent auto-restore loops
              sessionStorage.removeItem('checkout-backup');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore cart from backup:', e);
    }
  }, []);

  // Attempt restore on mount ONLY
  useEffect(() => {
    if (doors.length === 0) {
      restoreCartFromBackup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleQuantityChange = useCallback((id: string, qty: number) => {
    updateQuantity(id, qty);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback(
    (id: string) => {
      removeDoor(id);
      toast.success("Item removed from cart");
    },
    [removeDoor],
  );

  const handleSwapHinge = useCallback((id: string) => {
    swapHingeSide(id);
    toast.success("Hinge side swapped");
  }, [swapHingeSide]);

  const handleFinishChange = useCallback((id: string, finish: DoorOrderItem["finish"]) => {
    updateFinish(id, finish);
  }, [updateFinish]);

  const handleEditItem = useCallback((item: DoorOrderItem) => {
    loadFromCartItem(item);
    // Also set active door in store to ensure correct item is selected in builder
    useDoorStore.getState().setActiveDoor(item.id);
    setLocation("/");
  }, [loadFromCartItem, setLocation]);

  // ─── Totals ─────────────────────────────────────────────────────────────
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const vat = getVat();
  const grandTotal = getGrandTotal();


  // ─── Proceed to Payment ─────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (doors.length === 0) return;
    setIsLoading(true);

    try {
      // Build payload from useDoorStore doors
      const items = doors.map((door) => ({
        width: door.width,
        height: door.height,
        thickness: door.thickness,
        panelType: door.panelType,
        finish: door.finish,
        price: door.unitPrice,
        quantity: door.qty,
        category: door.panelType === "NONE" ? "slab" : "shaker",
        angledLeft: door.angledLeft,
        angledRight: door.angledRight,
        leftAngleDegrees: door.leftAngleDegrees,
        rightAngleDegrees: door.rightAngleDegrees,
        leftTriangleCutoutWidth: door.leftTriangleCutoutWidth,
        leftTriangleCutoutHeight: door.leftTriangleCutoutHeight,
        rightTriangleCutoutWidth: door.rightTriangleCutoutWidth,
        rightTriangleCutoutHeight: door.rightTriangleCutoutHeight,
        midRailsEnabled: door.midRailsEnabled,
        midRails: door.midRails,
        hingeDrilling: door.hingeDrilling,
        hinges: door.hinges,
      }));

      const payload: Record<string, any> = {
        items,
        // Backward compat: flat fields from first item
        ...items[0],
      };

      if (doors.length === 1) {
        payload.quantity = doors[0].qty;
      } else {
        payload.quantity = totalItems;
      }

      console.log("Checkout payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/quick-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server returned unexpected response (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      if (data.invoiceUrl) {
        // Backup cart to session storage before redirect (in case user cancels payment)
        try {
          sessionStorage.setItem('checkout-backup', JSON.stringify({
            doors: doors,
            timestamp: Date.now(),
          }));
        } catch (e) {
          console.warn('Failed to backup cart to session storage:', e);
        }

        toast.success("Redirecting to payment...", {
          description: "You'll complete your purchase on our secure checkout.",
        });

        // ─── Native Shopify Integration Path ───
        // If embedded in a Shopify iframe, send message to parent to use AJAX Cart
        const isEmbedded = window.parent !== window || window.location.search.includes('shop=');
        if (isEmbedded) {
          console.log("[Checkout] Embedded detected, messaging parent for Shopify Cart add...");
          window.parent.postMessage({
            type: 'SHOPIFY_ADD_TO_CART',
            items: items,
            invoiceUrl: data.invoiceUrl
          }, '*');

          // Important: We do NOT resetStore() here because the user might navigate back 
          // from the cart or checkout. The parent will handle the redirect.
          return;
        }

        // ─── Standalone Fallback Path ───
        // Clear the Zustand store after successful checkout redirect
        // Note: Cart will be restored from session storage if user returns without paying
        resetStore();

        if (window.parent !== window) {
          window.parent.location.href = data.invoiceUrl;
        } else {
          window.location.href = data.invoiceUrl;
        }
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);

      // ─── Storefront Fallback Logic ───
      // If payment system is not configured, try to add to Shopify cart directly via AJAX
      if (error.message?.includes("Payment system not configured") || error.message?.includes("credentials")) {
        try {
          toast.info("Configuring direct checkout...", {
            description: "Server checkout is unconfigured. Attempting to add items to your Shopify cart instead.",
          });

          // This logic matches shopify-door-configurator.liquid
          // It assumes we are embedded in a Shopify store
          for (const door of doors) {
            // Build properties for the AJAX API
            const properties: Record<string, string> = {
              'Width': `${door.width}mm`,
              'Height': `${door.height}mm`,
              'Thickness': `${door.thickness}mm`,
              'Panel Type': door.panelType,
              'Finish': door.finish,
              'Door Type': door.preset === 'double' ? 'Double' : 'Single',
            };

            if (door.angledLeft) properties['Left Angle'] = `${door.leftAngleDegrees}°`;
            if (door.angledRight) properties['Right Angle'] = `${door.rightAngleDegrees}°`;
            if (door.midRailsEnabled) properties['Mid Rails'] = `${door.midRails.length}`;
            if (door.hingeDrilling) properties['Hinge Holes'] = `${door.hinges.length}`;

            // Add each door to the Shopify cart
            // We use /cart/add.js which is the standard Shopify AJAX API
            const addToCartRes = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // Note: We don't have a specific Variant ID here because the configurator 
                // is usually used on a Product page where the base product ID is known.
                // In an embedded context, we might need a dummy product ID.
                // For now, we try to use a common pattern or fallback to error.
                id: (window as any).ShopifyAnalytics?.lib?.config?.workspace_id ||
                  (window as any).meta?.product?.variants?.[0]?.id ||
                  null,
                quantity: door.qty,
                properties
              })
            });

            if (!addToCartRes.ok) {
              const errText = await addToCartRes.text();
              throw new Error(`Shopify cart error: ${errText}`);
            }
          }

          toast.success("Added to Shopify cart!", {
            description: "Redirecting to your cart page...",
          });

          // Redirect to Shopify cart
          setTimeout(() => {
            window.location.href = '/cart';
          }, 1000);
          return; // Exit early as we've handled the fallback
        } catch (fallbackError: any) {
          console.error("Fallback error:", fallbackError);
          toast.error("Checkout failed", {
            description: "Payment system not configured and fallback to Shopify cart failed. Please contact the administrator.",
          });
          return;
        }
      }

      toast.error("Checkout failed", {
        description: error.message || "Please try again or contact support.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Redirect if empty (only after attempting restore)
  // We'll show the empty cart message if doors are still 0 after mount
  if (doors.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingCart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Your cart is empty</h2>
          <p className="text-sm text-stone-500 mb-6">
            Configure a door and add it to your cart to get started.
          </p>
          <Button
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Door Designer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent hover:text-orange-600"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Designer
          </Button>
          <Button
            variant="outline"
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => setLocation("/")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Door
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-6 h-6 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Your Order</h1>
            <p className="text-sm text-stone-500">
              {doors.length} product{doors.length > 1 ? "s" : ""} · {totalItems} total item
              {totalItems > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {doors.map((item, idx) => (
              <CartItemCard
                key={item.id}
                item={item}
                index={idx}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
                onSwapHinge={handleSwapHinge}
                onFinishChange={handleFinishChange}
                onEdit={handleEditItem}
              />
            ))}

            <button
              className="w-full border-2 border-dashed border-stone-300 hover:border-orange-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-orange-600 transition-colors group cursor-pointer"
              onClick={() => setLocation("/")}
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold">Add another door configuration</span>
              <span className="text-xs text-stone-400">
                Different size, panel, finish, or style
              </span>
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <Card className="border-stone-200 shadow-lg bg-white sticky top-8">
              <CardHeader className="bg-stone-50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="w-4 h-4 text-green-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Line items summary */}
                <div className="space-y-3 pb-4 border-b border-dashed">
                  {doors.map((item) => {
                    const cat = item.panelType === "NONE" ? "slab" : "shaker";
                    const catInfo = CATEGORY_LABELS[cat] || CATEGORY_LABELS.custom;
                    return (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900 text-sm truncate">
                            {catInfo.icon} {item.label}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {item.width}×{item.height}mm · {item.thickness}mm · {item.finish.replace(/_/g, " ")}
                            {item.angledLeft && " · Angled L"}
                            {item.angledRight && " · Angled R"}
                          </p>
                          <p className="text-xs text-stone-400 font-medium">
                            {PANEL_LABELS[item.panelType] || item.panelType} (Rebate: {item.rebateWidthMm}mm)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm">£{item.lineTotal.toFixed(2)}</span>
                          {item.qty > 1 && (
                            <p className="text-xs text-stone-400">
                              £{item.unitPrice.toFixed(2)} × {item.qty}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">£{grandTotal.toFixed(2)}</span>
                </div>

                {totalItems >= 5 && (
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-700">
                      <span className="font-semibold">Bulk order:</span> Orders of 10+ doors may
                      qualify for trade discounts. Contact us for a quote.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full h-12 mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-bold shadow-md disabled:opacity-70"
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={isLoading || doors.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-stone-400 mt-2">
                  You'll be redirected to our secure Shopify checkout
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}