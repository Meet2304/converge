export type SessionUser = {
  id: string;
  auth0Sub: string;
  email: string | null;
  displayName: string | null;
  moderationStatus: "ok" | "warned" | "suspended" | "banned";
};

export type AppSession = {
  user: SessionUser;
  issuedAt: number;
};
