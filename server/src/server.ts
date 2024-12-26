import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth";

const app = new Hono().use("*", cors()).route("/auth", authRoutes);

export default app;
