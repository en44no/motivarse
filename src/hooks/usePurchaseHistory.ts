import { useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import type { SharedTodo } from '../types/shared';

export type Urgency = 'overdue' | 'soon' | 'ok' | 'unknown';

export interface ProductStat {
  key: string;
  displayTitle: string;
  category?: string;
  count: number;
  lastPurchased: number;
  daysSince: number;
  avgDaysBetween: number | null;
  urgency: Urgency;
  isInList: boolean;
}

export type SortMode = 'urgency' | 'frequency' | 'recent';

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

function daysBetween(a: number, b: number): number {
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

const URGENCY_ORDER: Record<Urgency, number> = {
  overdue: 0,
  soon: 1,
  ok: 2,
  unknown: 3,
};

export function usePurchaseHistory(
  pendingTodos: SharedTodo[],
  sortMode: SortMode = 'urgency'
): { stats: ProductStat[]; totalDistinct: number; purchasedThisMonth: number } {
  const { purchaseHistory } = useDataContext();

  const stats = useMemo(() => {
    const now = Date.now();
    const pendingKeys = new Set(pendingTodos.map((t) => normalizeTitle(t.title)));

    // Group by normalized title
    const grouped = new Map<
      string,
      { displayTitle: string; category?: string; timestamps: number[] }
    >();

    for (const record of purchaseHistory) {
      const key = normalizeTitle(record.title);
      if (!grouped.has(key)) {
        grouped.set(key, {
          displayTitle: record.originalTitle,
          category: record.category,
          timestamps: [],
        });
      }
      grouped.get(key)!.timestamps.push(record.completedAt);
    }

    const result: ProductStat[] = [];

    for (const [key, { displayTitle, category, timestamps }] of grouped) {
      const sorted = [...timestamps].sort((a, b) => b - a);
      const lastPurchased = sorted[0];
      const daysSince = daysBetween(now, lastPurchased);
      const count = sorted.length;

      let avgDaysBetween: number | null = null;
      if (count >= 2) {
        const gaps: number[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
          gaps.push(daysBetween(sorted[i], sorted[i + 1]));
        }
        avgDaysBetween = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      }

      let urgency: Urgency;
      if (avgDaysBetween === null) {
        urgency = 'unknown';
      } else if (daysSince > avgDaysBetween * 1.2) {
        urgency = 'overdue';
      } else if (daysSince > avgDaysBetween * 0.8) {
        urgency = 'soon';
      } else {
        urgency = 'ok';
      }

      result.push({
        key,
        displayTitle,
        category,
        count,
        lastPurchased,
        daysSince,
        avgDaysBetween,
        urgency,
        isInList: pendingKeys.has(key),
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortMode === 'urgency') {
        const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return b.daysSince - a.daysSince;
      }
      if (sortMode === 'frequency') {
        return b.count - a.count;
      }
      // recent
      return b.lastPurchased - a.lastPurchased;
    });

    return result;
  }, [purchaseHistory, pendingTodos, sortMode]);

  const purchasedThisMonth = useMemo(() => {
    const now = Date.now();
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;
    return purchaseHistory.filter((r) => r.completedAt >= monthStart).length;
  }, [purchaseHistory]);

  return {
    stats,
    totalDistinct: stats.length,
    purchasedThisMonth,
  };
}
