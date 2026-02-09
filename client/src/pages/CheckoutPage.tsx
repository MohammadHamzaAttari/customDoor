import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, CreditCard, Loader2, Package, Ruler, Layers, Settings2, Check, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
    const [location, setLocation] = useLocation();
    const [doorConfig, setDoorConfig] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Panel type labels
    const panelLabels: Record<string, string> = {
        "STANDARD_12MM": "Standard 12mm MDF",
        "REEDED_19MM": "Reeded 19mm MDF",
        "MELAMINE_18MM": "Melamine 18mm",
        "NONE": "Slab (No Panel)",
        "FRETWORK": "Fretwork Pattern",
        "GLASS": "Glass Ready",
    };

    // Finish labels
    const finishLabels: Record<string, { label: string; color: string }> = {
        "RAW_UNASSEMBLED": { label: "Raw Unassembled", color: "bg-stone-100 text-stone-700" },
        "ASSEMBLED_PREP": { label: "Assembled & Prepped", color: "bg-stone-200 text-stone-800" },
        "PRIMED": { label: "Primed", color: "bg-emerald-100 text-emerald-700" },
    };

    useEffect(() => {
        // Load config from session
        const stored = sessionStorage.getItem('doorConfig');
        if (!stored) {
            toast.error("No cart items found");
            setLocation("/");
            return;
        }
        try {
            setDoorConfig(JSON.parse(stored));
        } catch (e) {
            console.error("Failed to parse cart", e);
            setLocation("/");
        }
    }, [setLocation]);

    const handleProceedToPayment = async () => {
        if (!doorConfig) return;
        
        setIsLoading(true);

        try {
            const response = await fetch('/api/quick-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...doorConfig, quantity }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout');
            }

            const data = await response.json();

            if (data.invoiceUrl) {
                toast.success("Redirecting to payment...", {
                    description: "You'll complete your purchase on our secure checkout."
                });

                // Clear cart
                sessionStorage.removeItem('doorConfig');

                // Redirect to Shopify checkout
                if (window.parent !== window) {
                    window.parent.location.href = data.invoiceUrl;
                } else {
                    window.location.href = data.invoiceUrl;
                }
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error("Checkout failed", {
                description: error.message || "Please try again or contact support.",
            });
            setIsLoading(false);
        }
    };

    if (!doorConfig) return null;

    const currentFinish = finishLabels[doorConfig.finish] || finishLabels.RAW_UNASSEMBLED;
    const areaM2 = (doorConfig.width * doorConfig.height) / 1000000;

    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent hover:text-orange-600"
                    onClick={() => setLocation("/")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Designer
                </Button>

                <h1 className="text-2xl font-bold text-stone-900 mb-6">Your Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Door Configuration Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-stone-200 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-orange-600" />
                                            Custom Trade Shaker Door
                                        </CardTitle>
                                        <CardDescription className="mt-1">Made-to-order MDF door</CardDescription>
                                    </div>
                                    <Badge className={cn("text-xs font-medium", currentFinish.color)}>
                                        {currentFinish.label}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <span className="text-sm font-medium text-stone-700">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                            onClick={() => setQuantity(q => q + 1)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Dimensions Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                                        <Ruler className="w-4 h-4 text-stone-400" />
                                        Dimensions
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">Height</p>
                                            <p className="text-lg font-bold text-stone-900">{doorConfig.height}mm</p>
                                        </div>
                                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">Width</p>
                                            <p className="text-lg font-bold text-stone-900">{doorConfig.width}mm</p>
                                        </div>
                                        <div className="bg-stone-50 rounded-lg p-3 text-center">
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">Thickness</p>
                                            <p className="text-lg font-bold text-stone-900">{doorConfig.thickness}mm</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-2 text-center">
                                        Area: {areaM2.toFixed(3)} m²
                                    </p>
                                </div>

                                <Separator />

                                {/* Specifications Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-stone-400" />
                                        Specifications
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-stone-600">Panel Type</span>
                                            <span className="text-sm font-medium text-stone-900">
                                                {panelLabels[doorConfig.panelType] || doorConfig.panelType}
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

                                {/* Custom Options Section */}
                                {(doorConfig.angledLeft || doorConfig.angledRight || 
                                  (doorConfig.midRailsEnabled && doorConfig.midRails?.length > 0) ||
                                  (doorConfig.hingeDrilling && doorConfig.hinges?.length > 0)) && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                                                <Settings2 className="w-4 h-4 text-stone-400" />
                                                Custom Options
                                            </h3>
                                            <div className="space-y-2">
                                                {doorConfig.angledLeft && (
                                                    <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                                                        <span className="text-sm text-orange-700 flex items-center gap-2">
                                                            <Check className="w-4 h-4" />
                                                            Left Angle
                                                        </span>
                                                        <span className="text-sm font-medium text-orange-900">
                                                            {doorConfig.leftAngleDegrees || 45}°
                                                        </span>
                                                    </div>
                                                )}
                                                {doorConfig.angledRight && (
                                                    <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                                                        <span className="text-sm text-orange-700 flex items-center gap-2">
                                                            <Check className="w-4 h-4" />
                                                            Right Angle
                                                        </span>
                                                        <span className="text-sm font-medium text-orange-900">
                                                            {doorConfig.rightAngleDegrees || 45}°
                                                        </span>
                                                    </div>
                                                )}
                                                {doorConfig.midRailsEnabled && doorConfig.midRails?.length > 0 && (
                                                    <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                                                        <span className="text-sm text-orange-700 flex items-center gap-2">
                                                            <Check className="w-4 h-4" />
                                                            Mid Rails
                                                        </span>
                                                        <span className="text-sm font-medium text-orange-900">
                                                            {doorConfig.midRails.length} rail{doorConfig.midRails.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {doorConfig.hingeDrilling && doorConfig.hinges?.length > 0 && (
                                                    <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                                                        <span className="text-sm text-orange-700 flex items-center gap-2">
                                                            <Check className="w-4 h-4" />
                                                            Hinge Drilling
                                                        </span>
                                                        <span className="text-sm font-medium text-orange-900">
                                                            {doorConfig.hinges.length} hole{doorConfig.hinges.length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Order Summary */}
                    <div className="space-y-6">
                        <Card className="border-stone-200 shadow-lg bg-white sticky top-8">
                            <CardHeader className="bg-stone-50 border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Lock className="w-4 h-4 text-green-600" />
                                    Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex justify-between items-start pb-4 border-b border-dashed">
                                    <div>
                                        <h3 className="font-semibold text-stone-900">Custom Door</h3>
                                        <p className="text-xs text-stone-500 mt-1">
                                            {doorConfig.width}mm × {doorConfig.height}mm × {doorConfig.thickness}mm
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            {panelLabels[doorConfig.panelType] || doorConfig.panelType}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold">£{doorConfig.price.toFixed(2)}</span>
                                        {quantity > 1 && (
                                            <p className="text-xs text-stone-500">× {quantity}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-stone-600">
                                        Subtotal (ex. VAT){quantity > 1 ? ` × ${quantity}` : ''}
                                    </span>
                                    <span>£{(doorConfig.price * quantity).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-stone-600">VAT (20%)</span>
                                    <span>£{(doorConfig.price * quantity * 0.2).toFixed(2)}</span>
                                </div>

                                <Separator className="my-2" />

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-600">£{(doorConfig.price * quantity * 1.2).toFixed(2)}</span>
                                </div>

                                <Button
                                    className="w-full h-12 mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-bold shadow-md disabled:opacity-70"
                                    size="lg"
                                    onClick={handleProceedToPayment}
                                    disabled={isLoading}
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
