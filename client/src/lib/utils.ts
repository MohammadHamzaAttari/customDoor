// client/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}

export function formatDimension(mm: number): string {
  if (mm >= 1000) {
    return `${(mm / 1000).toFixed(2)}m`;
  }
  return `${mm}mm`;
}

export function calculateArea(widthMm: number, heightMm: number): number {
  return (widthMm * heightMm) / 1000000;
}

export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}