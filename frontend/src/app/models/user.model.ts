export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  role: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}