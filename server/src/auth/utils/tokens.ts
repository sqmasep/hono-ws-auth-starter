import * as jwt from "hono/jwt";

export async function signToken(data: any) {
  return jwt.sign(data, process.env.JWT_SECRET!);
}

export async function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
