import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import {
  subscribeToJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from '../services/journal.service';
import { getToday } from '../lib/date-utils';
import type { JournalEntry } from '../types/journal';

export function useJournal() {
  const { user } = useAuthContext();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToJournalEntries(user.uid, (data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const todayEntry = useMemo(() => {
    const today = getToday();
    return entries.find((e) => e.date === today) ?? null;
  }, [entries]);

  async function saveEntry(date: string, content: string, mood?: string) {
    if (!user) return;
    await saveJournalEntry(user.uid, date, content, mood);
  }

  async function deleteEntry(id: string) {
    await deleteJournalEntry(id);
  }

  return { entries, loading, todayEntry, saveEntry, deleteEntry };
}
