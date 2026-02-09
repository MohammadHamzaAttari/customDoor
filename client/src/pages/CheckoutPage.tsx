// client/src/pages/CheckoutPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Lock, CreditCard, Loader2, Package, Ruler,
  Layers, Settings2, Check, Plus, Minus, Trash2, ShoppingCart, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getCart,
  updateItemQuantity,
  removeItem as removeCartItem,
  clearCart,
  type CartItem,
} from "@/lib/cartUtils";

// ─── Constants ────────────────────────────────────────────────────────────────
const PANEL_LABELS: Record<string, string> = {
  STANDARD_12MM: "Standard 12mm MDF",
  REEDED_19MM: "Reeded 19mm MDF",
  MELAMINE_18MM: "Melamine 18mm",
  NONE: "Slab (No Panel)",
  FRETWORK: "Fretwork Pattern",
  GLASS: "Glass Ready",
};

const FINISH_LABELS: Record<string, { label: string; color: string }> = {
  RAW_UNASSEMBLED: { label: "Raw Unassembled", color: "bg-stone-100 text-stone-700" },
  ASSEMBLED_PREP: { label: "Assembled & Prepped", color: "bg-stone-200 text-stone-800" },
  PRIMED: { label: "Primed", color: "bg-emerald-100 text-emerald-700" },
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
}: {
  item: CartItem;
  index: number;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const { config, quantity, category } = item;
  const currentFinish = FINISH_LABELS[config.finish] || FINISH_LABELS.RAW_UNASSEMBLED;
  const areaM2 = (config.width * config.height) / 1_000_000;
  const categoryInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.custom;
  const lineTotal = config.price * quantity;

  const hasCustomOptions =
    config.angledLeft ||
    config.angledRight ||
    (config.midRailsEnabled && config.midRails?.length) ||
    (config.hingeDrilling && config.hinges?.length);

  return (
    <Card className="border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-stone-50 to-stone-100 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo.icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Item {index + 1} — {categoryInfo.label}
          </span>
        </div>
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

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-orange-600" />
              Custom Trade {categoryInfo.label}
            </CardTitle>
            <CardDescription className="mt-1">Made-to-order MDF door</CardDescription>
          </div>
          <Badge className={cn("text-xs font-medium", currentFinish.color)}>
            {currentFinish.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        {/* Quantity + Line Price */}
        <div className="flex items-center justify-between p-3 bg-orange-50/60 rounded-xl border border-orange-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-stone-700">Qty</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-stone-300"
                onClick={() => onQuantityChange(item.id, Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-lg font-bold w-8 text-center tabular-nums">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => onQuantityChange(item.id, quantity + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">£{config.price.toFixed(2)} each</p>
            <p className="text-lg font-bold text-stone-900">£{lineTotal.toFixed(2)}</p>
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
              { label: "Height", value: `${config.height}mm` },
              { label: "Width", value: `${config.width}mm` },
              { label: "Thickness", value: `${config.thickness}mm` },
            ].map((d) => (
              <div key={d.label} className="bg-stone-50 rounded-lg p-3 text-center">
                <p className="text-xs text-stone-500 uppercase tracking-wider">{d.label}</p>
                <p className="text-lg font-bold text-stone-900">{d.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-2 text-center">Area: {areaM2.toFixed(3)} m²</p>
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
                {PANEL_LABELS[config.panelType] || config.panelType}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-stone-600">Finish</span>
              <span className="text-sm font-medium text-stone-900">
                {currentFinish.label}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Options */}
        {hasCustomOptions && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-stone-400" />
                Custom Options
              </h3>
              <div className="space-y-2">
                {config.angledLeft && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Left Angle
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {config.leftAngleDegrees || 45}°
                    </span>
                  </div>
                )}
                {config.angledRight && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Right Angle
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {config.rightAngleDegrees || 45}°
                    </span>
                  </div>
                )}
                {config.midRailsEnabled && config.midRails?.length > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Mid Rails
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {config.midRails.length} rail{config.midRails.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {config.hingeDrilling && config.hinges?.length > 0 && (
                  <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-orange-700 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Hinge Drilling
                    </span>
                    <span className="text-sm font-medium text-orange-900">
                      {config.hinges.length} hole{config.hinges.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helper: flatten a CartItem into the old API format ────────────────────────
function flattenCartItem(item: CartItem) {
  return {
    width: item.config.width,
    height: item.config.height,
    thickness: item.config.thickness,
    panelType: item.config.panelType,
    finish: item.config.finish,
    price: item.config.price,
    quantity: item.quantity,
    category: item.category,
    angledLeft: item.config.angledLeft || false,
    angledRight: item.config.angledRight || false,
    leftAngleDegrees: item.config.leftAngleDegrees || 0,
    rightAngleDegrees: item.config.rightAngleDegrees || 0,
    midRailsEnabled: item.config.midRailsEnabled || false,
    midRails: item.config.midRails || [],
    hingeDrilling: item.config.hingeDrilling || false,
    hinges: item.config.hinges || [],
  };
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      setLocation("/");
      return;
    }
    setCartItems(items);
  }, [setLocation]);

  const handleQuantityChange = useCallback((id: string, qty: number) => {
    const updated = updateItemQuantity(id, qty);
    setCartItems(updated);
  }, []);

  const handleRemoveItem = useCallback(
    (id: string) => {
      const updated = removeCartItem(id);
      setCartItems(updated);
      if (updated.length === 0) {
        toast.info("Cart is now empty — returning to designer");
        setTimeout(() => setLocation("/"), 600);
      } else {
        toast.success("Item removed from cart");
      }
    },
    [setLocation]
  );

  // ─── Totals ─────────────────────────────────────────────────────────────
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.config.price * item.quantity, 0);
  const vat = subtotal * 0.2;
  const grandTotal = subtotal + vat;

  // ─── Proceed to Payment ─────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (cartItems.length === 0) return;
    setIsLoading(true);

    try {
      // Build the payload — send BOTH the new "items" array AND
      // the old flat fields for backward compatibility with existing backend
      const flatItems = cartItems.map(flattenCartItem);

      // The payload includes:
      // - "items": array for multi-item support (new backend)
      // - Top-level flat fields from first item (old backend compatibility)
      // - "quantity" summed if single unique product, or per-item in array
      const payload: Record<string, any> = {
        // ── New format: items array ──
        items: flatItems,

        // ── Old format: flat fields from first item for backward compat ──
        ...flatItems[0],
      };

      // If there's only ONE unique product, use combined quantity at top level
      if (cartItems.length === 1) {
        payload.quantity = cartItems[0].quantity;
      } else {
        // Multiple products — total quantity at top level as fallback
        payload.quantity = totalItems;
      }

      console.log("Checkout payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/quick-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Try to parse response as JSON
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
        toast.success("Redirecting to payment...", {
          description: "You'll complete your purchase on our secure checkout.",
        });

        clearCart();

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
      toast.error("Checkout failed", {
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) return null;

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
            <h1 className="text-2xl font-bold text-stone-900">Your Cart</h1>
            <p className="text-sm text-stone-500">
              {cartItems.length} product{cartItems.length > 1 ? "s" : ""} · {totalItems} total item
              {totalItems > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, idx) => (
              <CartItemCard
                key={item.id}
                item={item}
                index={idx}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
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
                Different size, panel, finish, or category
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
                {/* Line items */}
                <div className="space-y-3 pb-4 border-b border-dashed">
                  {cartItems.map((item) => {
                    const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.custom;
                    const lineTotal = item.config.price * item.quantity;
                    return (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900 text-sm truncate">
                            {catInfo.icon} {catInfo.label}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {item.config.width}×{item.config.height}×{item.config.thickness}mm
                          </p>
                          <p className="text-xs text-stone-400">
                            {PANEL_LABELS[item.config.panelType] || item.config.panelType}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm">£{lineTotal.toFixed(2)}</span>
                          {item.quantity > 1 && (
                            <p className="text-xs text-stone-400">
                              £{item.config.price.toFixed(2)} × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">Subtotal (ex. VAT)</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-600">VAT (20%)</span>
                  <span>£{vat.toFixed(2)}</span>
                </div>

                <Separator className="my-2" />

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
                  disabled={isLoading || cartItems.length === 0}
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