import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: 'payment' | 'maintenance' | 'announcement' | 'lease';
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationState {
  isDrawerOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;

  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  /** Replace the list wholesale — call this from a TanStack Query `onSuccess`/effect. */
  setNotifications: (items: NotificationItem[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isDrawerOpen: false,
  notifications: [],
  unreadCount: 0,

  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.read).length,
    }),

  markAsRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    }),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
