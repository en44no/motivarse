export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  partnerId: string | null;
  coupleId: string | null;
  createdAt: number;
  fcmToken?: string;
  notificationsEnabled?: boolean;
  settings: {
    notifications: boolean;
    soundEnabled?: boolean;
    theme?: string;
  };
}

export interface Couple {
  coupleId: string;
  members: [string, string];
  memberNames: Record<string, string>;
  createdAt: number;
}
