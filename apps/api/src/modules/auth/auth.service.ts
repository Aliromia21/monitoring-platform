import bcrypt from "bcrypt";
import { env } from "../../config/env";
import { UserModel } from "../users/user.model";
import { AppError } from "../../utils/errors";
import { signToken } from "../../utils/jwt";

export async function registerUser(input: { email: string; password: string; name: string }) {
  const email = input.email.toLowerCase().trim();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already registered");

  const passwordHash = await bcrypt.hash(input.password, env.bcryptCost);
  const user = await UserModel.create({ email, name: input.name.trim(), passwordHash });

  const token = signToken({ sub: user._id.toString(), email: user.email });

  return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();

  const user = await UserModel.findOne({ email });
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const token = signToken({ sub: user._id.toString(), email: user.email });

  return { token, user: { id: user._id.toString(), email: user.email, name: user.name } };
}
