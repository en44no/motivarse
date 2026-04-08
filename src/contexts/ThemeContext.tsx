import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME_ID, getThemeById, type ThemeDefinition } from '../config/themes';
import { useAuthContext } from './AuthContext';
import { updateUserSettings } from '../services/user.service';

const THEME_CACHE_KEY = 'gestionarse_theme';

function getCachedThemeId(): string {
  try {
    return localStorage.getItem(THEME_CACHE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

function cacheThemeId(id: string) {
  try {
    localStorage.setItem(THEME_CACHE_KEY, id);
  } catch { /* ignore */ }
}

function applyThemeToRoot(theme: ThemeDefinition) {
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(theme.colors)) {
    root.style.setProperty(prop, value);
  }
}

// Apply cached theme immediately on module load to avoid flash
const cachedId = getCachedThemeId();
const cachedTheme = getThemeById(cachedId);
applyThemeToRoot(cachedTheme);

interface ThemeContextType {
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: cachedTheme,
  setTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuthContext();
  const [currentTheme, setCurrentTheme] = useState<ThemeDefinition>(cachedTheme);

  // Sync from profile when it loads (Firestore is source of truth)
  useEffect(() => {
    if (profile?.settings?.theme) {
      const theme = getThemeById(profile.settings.theme);
      setCurrentTheme(theme);
      applyThemeToRoot(theme);
      cacheThemeId(theme.id);
    }
  }, [profile?.settings?.theme]);

  const setTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
    applyThemeToRoot(theme);
    cacheThemeId(theme.id);

    // Persist to Firestore
    if (user) {
      updateUserSettings(user.uid, { theme: themeId }).catch(() => {});
    }
  }, [user]);

  const value = useMemo(() => ({ currentTheme, setTheme, themes: THEMES }), [currentTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
