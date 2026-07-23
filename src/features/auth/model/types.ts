export interface AuthUser {
  id?: string;
  name?: string;
  phone: string;
  roles?: string[];
}

export interface AuthCredentials {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}
