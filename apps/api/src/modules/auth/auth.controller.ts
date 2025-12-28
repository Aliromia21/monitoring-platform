import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "./auth.schemas";
import { registerUser, loginUser } from "./auth.service";
import { AppError } from "../../utils/errors";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { UserModel } from "../users/user.model";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
    const result = await registerUser(parsed.data);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
    const result = await loginUser(parsed.data);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

export async function me(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const user = await UserModel.findById(req.user.id).lean();
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    return res.json({ user: { id: user._id.toString(), email: user.email, name: user.name } });
  } catch (e) {
    return next(e);
  }
}
