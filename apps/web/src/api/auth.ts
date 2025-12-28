import { api } from "./client";
import type { AuthResponse } from "./types";

export function register(input: { email: string; password: string; name?: string }) {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function login(input: { email: string; password: string }) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function me() {
  return api<{ user: AuthResponse["user"] }>("/auth/me");
}
