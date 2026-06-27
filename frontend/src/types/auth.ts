export interface OwnerUser {
  id: number;
  username: string;
  email: string;
  role: "owner";
}

export interface AuthSession {
  user: OwnerUser;
  csrfToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
