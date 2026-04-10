import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Density = 'cozy' | 'compact';

const STORAGE_KEY = 'motivarse_density';

interface DensityContextValue {
  density: Density;
  setDensity: (d: Density) => void;
  toggleDensity: () => void;
  isCompact: boolean;
}

const DensityContext = createContext<DensityContextValue | undefined>(undefined);

/**
 * Provider del modo de densidad de listas.
 *
 * - `cozy` (default): vista actual con todos los detalles
 * - `compact`: filas mas chicas, menos info, mas items por viewport
 *
 * Persiste en localStorage.
 */
export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>('cozy');

  // Hidratar de localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'compact' || stored === 'cozy') {
        setDensityState(stored);
      }
    } catch {
      // ignore (private mode, etc.)
    }
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      // ignore
    }
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState((prev) => {
      const next = prev === 'cozy' ? 'compact' : 'cozy';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<DensityContextValue>(
    () => ({
      density,
      setDensity,
      toggleDensity,
      isCompact: density === 'compact',
    }),
    [density, setDensity, toggleDensity],
  );

  return (
    <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
  );
}

export function useDensity(): DensityContextValue {
  const ctx = useContext(DensityContext);
  if (!ctx) {
    throw new Error('useDensity must be used inside a DensityProvider');
  }
  return ctx;
}
