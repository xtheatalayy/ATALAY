'use client';

import {
  BookOpen,
  Bus,
  CircleEllipsis,
  Droplets,
  Dumbbell,
  Flower2,
  Footprints,
  HeartPulse,
  Moon,
  Pill,
  Popcorn,
  ReceiptText,
  Shirt,
  ShoppingCart,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cart: ShoppingCart,
  utensils: UtensilsCrossed,
  bus: Bus,
  receipt: ReceiptText,
  heart: HeartPulse,
  popcorn: Popcorn,
  shirt: Shirt,
  ellipsis: CircleEllipsis,
  water: Droplets,
  walk: Footprints,
  pill: Pill,
  dumbbell: Dumbbell,
  sleep: Moon,
  meditate: Flower2,
  book: BookOpen,
  sun: Sun,
  sparkles: Sparkles,
};

export function GlyphIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = ICONS[name ?? ''] ?? Sparkles;
  return <Icon className={className} />;
}
