import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;

  activeTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  /** Landlord maintenance board view toggle */
  maintenanceView: 'kanban' | 'list';
  setMaintenanceView: (view: 'kanban' | 'list') => void;

  /** Per-session dismissed banner ids (e.g. PlatformAlertBanner) */
  dismissedBanners: string[];
  dismissBanner: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),

      activeTheme: 'light',
      setTheme: (theme) => set({ activeTheme: theme }),

      maintenanceView: 'kanban',
      setMaintenanceView: (view) => set({ maintenanceView: view }),

      dismissedBanners: [],
      dismissBanner: (id) =>
        set((s) => ({ dismissedBanners: [...new Set([...s.dismissedBanners, id])] })),
    }),
    {
      name: 'rms-ui-preferences', // localStorage key
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeTheme: state.activeTheme,
        maintenanceView: state.maintenanceView,
      }),
    }
  )
);
