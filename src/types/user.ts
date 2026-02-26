export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  partnerId: string | null;
  coupleId: string | null;
  createdAt: number;
  settings: {
    notifications: boolean;
  };
}

export interface Couple {
  coupleId: string;
  members: [string, string];
  memberNames: Record<string, string>;
  createdAt: number;
}
