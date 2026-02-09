// client/src/lib/cartUtils.ts

export interface DoorConfigData {
  width: number;
  height: number;
  thickness: number;
  panelType: string;
  finish: string;
  price: number;
  angledLeft?: boolean;
  angledRight?: boolean;
  leftAngleDegrees?: number;
  rightAngleDegrees?: number;
  midRailsEnabled?: boolean;
  midRails?: any[];
  hingeDrilling?: boolean;
  hinges?: any[];
  [key: string]: any;
}

export interface CartItem {
  id: string;
  config: DoorConfigData;
  quantity: number;
  category: string;
}

const CART_KEY = "cartItems";
const LEGACY_KEY = "doorConfig";

function generateId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Build a fingerprint string from a config so we can detect duplicates.
 */
export function configFingerprint(config: DoorConfigData): string {
  return [
    config.width,
    config.height,
    config.thickness,
    config.panelType,
    config.finish,
    config.angledLeft ? "AL" : "",
    config.angledRight ? "AR" : "",
    config.leftAngleDegrees || 0,
    config.rightAngleDegrees || 0,
    config.midRailsEnabled ? `MR${config.midRails?.length || 0}` : "",
    config.hingeDrilling ? `H${config.hinges?.length || 0}` : "",
  ].join("|");
}

/**
 * Read all cart items from sessionStorage.
 * Auto-migrates the old single `doorConfig` key if found.
 */
export function getCart(): CartItem[] {
  try {
    const cartData = sessionStorage.getItem(CART_KEY);
    if (cartData) {
      const parsed = JSON.parse(cartData);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Backward compat: migrate single doorConfig
    const legacy = sessionStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const config = JSON.parse(legacy);
      const item: CartItem = {
        id: generateId(),
        config,
        quantity: 1,
        category: config.category || "shaker",
      };
      saveCart([item]);
      sessionStorage.removeItem(LEGACY_KEY);
      return [item];
    }
  } catch (e) {
    console.error("Failed to load cart:", e);
  }
  return [];
}

/**
 * Save the full cart array to sessionStorage.
 */
export function saveCart(items: CartItem[]): void {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
  // Also clean up legacy key
  sessionStorage.removeItem(LEGACY_KEY);
}

/**
 * Add a door config to the cart.
 * If an identical config already exists, increment its quantity instead.
 * Returns the updated cart.
 */
export function addToCart(
  config: DoorConfigData,
  category: string = "shaker",
  quantity: number = 1
): CartItem[] {
  const items = getCart();
  const fp = configFingerprint(config);

  // Check if an identical config already exists
  const existingIndex = items.findIndex(
    (item) => item.category === category && configFingerprint(item.config) === fp
  );

  if (existingIndex >= 0) {
    // Same config exists → increment quantity
    items[existingIndex].quantity += quantity;
  } else {
    // New unique config → push new item
    items.push({
      id: generateId(),
      config: { ...config },
      quantity,
      category,
    });
  }

  saveCart(items);
  return items;
}

/**
 * Update the quantity of a specific cart item by id.
 */
export function updateItemQuantity(id: string, quantity: number): CartItem[] {
  const items = getCart().map((item) =>
    item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
  );
  saveCart(items);
  return items;
}

/**
 * Remove a cart item by id.
 */
export function removeItem(id: string): CartItem[] {
  const items = getCart().filter((item) => item.id !== id);
  saveCart(items);
  return items;
}

/**
 * Clear the entire cart.
 */
export function clearCart(): void {
  sessionStorage.removeItem(CART_KEY);
  sessionStorage.removeItem(LEGACY_KEY);
}

/**
 * Get total number of items (sum of all quantities).
 */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}