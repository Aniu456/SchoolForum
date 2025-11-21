import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    sidebarOpen: boolean;
    unreadNotifications: number;
    activeConversationId: string | null;
    activePostId: string | null;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setUnreadNotifications: (count: number) => void;
    incrementUnreadNotifications: () => void;
    setActiveConversationId: (id: string | null) => void;
    setActivePostId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: false,
            unreadNotifications: 0,
            activeConversationId: null,
            activePostId: null,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setUnreadNotifications: (count: number) => set({ unreadNotifications: count }),
            incrementUnreadNotifications: () =>
                set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
            setActiveConversationId: (id) => set({ activeConversationId: id }),
            setActivePostId: (id) => set({ activePostId: id }),
        }),
        {
            name: 'ui-storage',
        }
    )
);
