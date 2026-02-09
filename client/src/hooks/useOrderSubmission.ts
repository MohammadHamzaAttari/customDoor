// client/src/hooks/useOrderSubmission.ts
import { useState, useCallback } from "react";
import { useSyncStatus } from "@/lib/stores/useSyncStatus";
import { z } from "zod";

// Validation schema
const orderFormSchema = z.object({
  customerName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  customerEmail: z.string()
    .email("Please enter a valid email address"),
  companyName: z.string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name is too long"),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      // Must start with + for international format
      if (!val.startsWith("+")) {
        return false;
      }
      // Remove non-digits except +
      const cleaned = val.replace(/[^\d+]/g, "");
      return cleaned.length >= 10 && cleaned.length <= 16;
    }, "Use international format: +44 7700 900000"),
  addressLine1: z.string()
    .min(5, "Address must be at least 5 characters"),
  city: z.string()
    .min(2, "City is required"),
  postcode: z.string()
    .min(3, "Postcode is required"),
  quantity: z.number()
    .min(1, "Quantity must be at least 1")
    .max(100, "Maximum quantity is 100"),
  jobReference: z.string().optional(),
  specialRequirements: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

// Validation helper
function validateForm(data: unknown): {
  success: boolean;
  data?: OrderFormData;
  errors: Record<string, string>
} {
  const result = orderFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors };
}

// Field validation helper
function validateField(
  fieldName: string,
  value: unknown,
  allData: Record<string, unknown>
): string | null {
  const testData = { ...allData, [fieldName]: value };
  const result = orderFormSchema.safeParse(testData);

  if (result.success) return null;

  const fieldError = result.error.issues.find(
    (err) => err.path[0] === fieldName
  );

  return fieldError?.message || null;
}

export function useOrderSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const syncStatus = useSyncStatus();

  const handleChange = useCallback((field: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    syncStatus.clearFieldError(field);
  }, [fieldErrors, syncStatus]);

  const handleBlur = useCallback((
    field: string,
    value: unknown,
    allData: Record<string, unknown>
  ) => {
    const error = validateField(field, value, allData);

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  const submitOrder = useCallback(async (formData: Record<string, unknown>, orderItems: any[]) => {
    setIsSubmitting(true);
    syncStatus.startSync();

    try {
      // Step 0: Pre-fetch styles and finishes to get numeric IDs
      syncStatus.setPhase("validating", "Preparing catalog data...", 5);
      const [stylesRes, finishesRes] = await Promise.all([
        fetch("/api/door-styles"),
        fetch("/api/finish-options")
      ]);

      const styles = await stylesRes.json();
      const finishes = await finishesRes.json();

      // Validate that we got arrays back
      if (!Array.isArray(styles) || styles.length === 0) {
        throw new Error("No door styles found in database. Please run: npm run db:seed");
      }
      if (!Array.isArray(finishes) || finishes.length === 0) {
        throw new Error("No finish options found in database. Please run: npm run db:seed");
      }

      // Step 1: Validate form
      syncStatus.setPhase("validating", "Validating form data...", 10);

      const validation = validateForm(formData);
      console.log("[Submission] Validation Result:", validation.success, validation.data);

      if (!validation.success) {
        console.error("[Submission] Validation Failed:", validation.errors);
        setFieldErrors(validation.errors);
        syncStatus.setFieldErrors(validation.errors);
        syncStatus.addError({
          code: "VALIDATION_ERROR",
          message: "Please fix the errors in the form",
        });
        setIsSubmitting(false);
        return { success: false };
      }

      // Step 2: Create/find customer
      syncStatus.setPhase("submitting", "Creating customer...", 25);

      const customerPayload = {
        companyName: validation.data!.companyName,
        contactName: validation.data!.customerName,
        email: validation.data!.customerEmail,
        phone: validation.data!.phone,
        invoiceAddressLine1: validation.data!.addressLine1 || "Not Provided",
        invoiceCity: validation.data!.city || "Not Provided",
        invoicePostcode: validation.data!.postcode,
        invoiceCountry: "UK",
      };

      console.log("[Submission] Sending Customer Payload:", customerPayload);

      const customerResponse = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerPayload),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create customer");
      }

      const customer = await customerResponse.json();
      syncStatus.setPhase("submitting", "Creating order...", 40);

      // Calculate totals
      const subtotal = orderItems.reduce((acc, item) => acc + (item.price || 0), 0);

      // Step 3: Create order
      const orderPayload = {
        customerId: customer.id,
        orderReference: `ORD-${Date.now()}`,
        customerJobReference: validation.data!.jobReference || null,
        dateRequired: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryMethod: "COLLECTION",
        specialRequirements: validation.data!.specialRequirements || null,
        subtotalExcVat: subtotal.toFixed(2),
        totalExcVat: subtotal.toFixed(2),
        vatAmount: (subtotal * 0.2).toFixed(2),
        totalIncVat: (subtotal * 1.2).toFixed(2),
      };

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create order");
      }

      const order = await orderResponse.json();
      syncStatus.setOrderId(order.id, order.orderReference);
      syncStatus.setPhase("submitting", `Adding ${orderItems.length} item(s) to order...`, 50);

      // Step 4: Create order items sequentially
      for (let i = 0; i < orderItems.length; i++) {
        const config = orderItems[i];

        // Map current config to style/finish IDs
        const currentStyleCode = config.panelType === "NONE" ? "SLAB" : "SHAKER";
        const style = styles.find((s: any) => s.styleCode === currentStyleCode) || styles[0];
        const finish = finishes.find((f: any) => f.finishCode === (config.finish || "RAW_UNASSEMBLED")) || finishes[0];

        if (!style || !finish) {
          throw new Error("Missing database configuration: No door styles or finish options found. Please run the database seed command.");
        }

        const itemPayload = {
          orderId: order.id,
          lineNumber: i + 1,
          quantity: config.qty || config.quantity || 1,
          styleId: style.id,
          finishId: finish.id,
          heightMm: config.height,
          widthMm: config.width,
          panelType: config.panelType,
          isAngled: config.angledLeft || config.angledRight,
          angledShorterSide: config.angledLeft ? "LEFT" : (config.angledRight ? "RIGHT" : null),
          angledShortHeightMm: config.angledLeft ? config.height - config.leftTriangleCutoutHeight : (config.angledRight ? config.height - config.rightTriangleCutoutHeight : null),
          borderLeftStile: config.leftStile || config.borderWidth || 70,
          borderRightStile: config.rightStile || config.borderWidth || 70,
          borderTopRail: config.topRail || config.borderWidth || 70,
          borderBottomRail: config.bottomRail || config.borderWidth || 70,
          hingeQuantity: config.hingeDrilling ? (config.hinges?.length || 0) : 0,
          basePrice: ((config.price || 0) / (config.qty || config.quantity || 1)).toFixed(2),
          unitPriceExcVat: ((config.price || 0) / (config.qty || config.quantity || 1)).toFixed(2),
          lineTotalExcVat: (config.price || 0).toFixed(2),
        };

        const itemResponse = await fetch(`/api/orders/${order.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        });

        if (!itemResponse.ok) {
          const errorData = await itemResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to add item ${i + 1} to order`);
        }

        const item = await itemResponse.json();

        // Step 4.1: Create Hinges if enabled
        if (config.hingeDrilling && config.hinges && config.hinges.length > 0) {
          syncStatus.setPhase("submitting", `Adding hinges for item ${i + 1}...`, 55);
          await Promise.all(config.hinges.map((hinge: any) =>
            fetch(`/api/order-items/${item.id}/hinges`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                hingeType: hinge.type || "SCREW_POINTS",
                positionFromBottomMm: hinge.positionFromBottomMm,
                side: hinge.side,
              }),
            })
          ));
        }

        // Step 4.2: Create Mid Rails if enabled
        if (config.midRailsEnabled && config.midRails && config.midRails.length > 0) {
          syncStatus.setPhase("submitting", `Adding mid rails for item ${i + 1}...`, 58);
          await Promise.all(config.midRails.map((rail: any, idx: number) =>
            fetch(`/api/order-items/${item.id}/mid-rails`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                railNumber: idx + 1,
                positionFromBottomMm: rail.positionFromBottom,
                railWidthMm: rail.dimension,
              }),
            })
          ));
        }
      }

      syncStatus.setPhase("syncing", "Syncing with Shopify...", 70);

      // Step 5: Sync with Shopify
      const shopifyResponse = await fetch(`/api/orders/${order.id}/sync-shopify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const shopifyData = await shopifyResponse.json().catch(() => ({}));

      if (!shopifyResponse.ok) {
        const errorMessage = shopifyData.message || "Shopify sync failed";

        // Parse specific Shopify field errors
        if (errorMessage.toLowerCase().includes("phone") || errorMessage.toLowerCase().includes("contact")) {
          const displayMessage = errorMessage.includes("taken")
            ? "This phone number is already registered with another customer in Shopify."
            : `Shopify rejected this phone number: ${errorMessage}`;

          syncStatus.addError({
            code: "SHOPIFY_PHONE_ERROR",
            message: displayMessage,
            field: "phone",
          });
          setFieldErrors((prev) => ({
            ...prev,
            phone: displayMessage
          }));
        } else if (errorMessage.toLowerCase().includes("email")) {
          syncStatus.addError({
            code: "SHOPIFY_EMAIL_ERROR",
            message: "Invalid email format for Shopify",
            field: "customerEmail",
          });
          setFieldErrors((prev) => ({
            ...prev,
            customerEmail: "Invalid email format for Shopify"
          }));
        } else {
          syncStatus.addError({
            code: "SHOPIFY_SYNC_ERROR",
            message: errorMessage,
          });
        }

        setIsSubmitting(false);
        return { success: false, orderId: order.id };
      }

      // Step 6: Success!
      syncStatus.setPhase("complete", "Order created successfully!", 100);

      setIsSubmitting(false);
      return {
        success: true,
        orderId: order.id,
        orderReference: order.orderReference,
        invoiceUrl: shopifyData.invoice_url // Return invoice URL
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      console.error("Submission Error:", error);

      if (syncStatus.errors.length === 0) {
        syncStatus.addError({
          code: "SUBMISSION_ERROR",
          message,
        });
      }

      setIsSubmitting(false);
      return { success: false };
    }
  }, [syncStatus]);

  const reset = useCallback(() => {
    setFieldErrors({});
    syncStatus.reset();
  }, [syncStatus]);

  return {
    submitOrder,
    isSubmitting,
    orderValidation: {
      fieldErrors,
      handleChange,
      handleBlur,
    },
    reset,
  };
}