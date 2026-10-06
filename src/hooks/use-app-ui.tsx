import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CreateApplicationRequest } from '@/types/api';

interface AppUIContextValue {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  addApplicationOpen: boolean;
  addApplicationDefaults: Partial<CreateApplicationRequest> | null;
  openAddApplication: (defaults?: Partial<CreateApplicationRequest>) => void;
  setAddApplicationOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  syncDetailsOpen: boolean;
  setSyncDetailsOpen: (open: boolean) => void;
}

const AppUIContext = createContext<AppUIContextValue | null>(null);

export function AppUIProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [addApplicationOpen, setAddApplicationOpen] = useState(false);
  const [addApplicationDefaults, setDefaults] = useState<Partial<CreateApplicationRequest> | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncDetailsOpen, setSyncDetailsOpen] = useState(false);

  const openAddApplication = useCallback((defaults?: Partial<CreateApplicationRequest>) => {
    setDefaults(defaults ?? null);
    setAddApplicationOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      commandOpen,
      setCommandOpen,
      addApplicationOpen,
      addApplicationDefaults,
      openAddApplication,
      setAddApplicationOpen,
      mobileNavOpen,
      setMobileNavOpen,
      syncDetailsOpen,
      setSyncDetailsOpen,
    }),
    [commandOpen, addApplicationOpen, addApplicationDefaults, openAddApplication, mobileNavOpen, syncDetailsOpen],
  );
  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI() {
  const ctx = useContext(AppUIContext);
  if (!ctx) throw new Error('useAppUI must be used inside AppUIProvider');
  return ctx;
}
