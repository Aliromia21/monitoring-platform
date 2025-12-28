import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { sub: string; email: string };

export function signToken(payload: JwtPayload): string {
  const secret: Secret = env.jwtSecret as unknown as Secret;

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtPayload {
  const secret: Secret = env.jwtSecret as unknown as Secret;
  return jwt.verify(token, secret) as JwtPayload;
}
