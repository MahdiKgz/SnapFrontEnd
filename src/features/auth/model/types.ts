export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  roles: string[];
  createdAt?: string;
}

export interface AuthCredentials {
  accessToken: string;
  user: AuthUser;
}

export type AuthStatus = "checking" | "authenticated" | "anonymous";

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}
