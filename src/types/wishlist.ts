export type WishlistCategory = 'viajes' | 'restaurantes' | 'pelis' | 'actividades' | 'compras' | 'otro';

export interface WishlistItem {
  id: string;
  coupleId: string;
  title: string;
  description?: string;
  category: WishlistCategory;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  createdBy: string;
  createdAt: number;
}

export const WISHLIST_CATEGORIES: { value: WishlistCategory; label: string; emoji: string }[] = [
  { value: 'viajes', label: 'Viajes', emoji: '\u2708\uFE0F' },
  { value: 'restaurantes', label: 'Restaurantes', emoji: '\uD83C\uDF7D\uFE0F' },
  { value: 'pelis', label: 'Pelis/Series', emoji: '\uD83C\uDFAC' },
  { value: 'actividades', label: 'Actividades', emoji: '\uD83C\uDFAF' },
  { value: 'compras', label: 'Compras', emoji: '\uD83D\uDECD\uFE0F' },
  { value: 'otro', label: 'Otro', emoji: '\uD83D\uDCA1' },
];
