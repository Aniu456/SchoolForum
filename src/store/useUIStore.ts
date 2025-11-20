import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    sidebarOpen: boolean;
    unreadNotifications: number;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setUnreadNotifications: (count: number) => void;
    incrementUnreadNotifications: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: false,
            unreadNotifications: 0,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setUnreadNotifications: (count: number) => set({ unreadNotifications: count }),
            incrementUnreadNotifications: () =>
                set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
        }),
        {
            name: 'ui-storage',
        }
    )
);

