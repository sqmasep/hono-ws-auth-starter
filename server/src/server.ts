import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { vValidator } from "@hono/valibot-validator";
import { cors } from "hono/cors";
import { emailSchema } from "../validation/email";
import {
  ArcticFetchError,
  OAuth2RequestError,
  decodeIdToken,
  generateState,
} from "arctic";
import * as v from "valibot";
import github from "./auth/github";

const app = new Hono()
  .use("*", cors())
  .get("/auth/github", c => {
    const state = generateState();

    const scopes = ["user:email", "repo"];
    const url = github.createAuthorizationURL(state, scopes);

    setCookie(
      c,
      state,
      JSON.stringify({
        secure: process.env.NODE_ENV === "production",
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10, // 10 min
      })
    );

    return c.json({}, 302, { Location: url.toString() });
  })
  .get("/auth/github/callback", async c => {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = getCookie(c, state!);

    console.log("auth github callback code", code);
    console.log("auth github callback state", state);
    console.log("auth github callback storedState", storedState);

    if (
      code === null ||
      storedState === null
      //  || state !== storedState
    ) {
      // 400
      throw new Error("Invalid request");
    }

    try {
      const tokens = await github.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const data = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }).then(res => res.json());

      // const claims = decodeIdToken(accessToken);
      // console.log("auth github callback claims", claims);

      console.log("auth github callback data", data);

      return c.json({
        success: true,
        code,
        state,
        storedState,
        data,
        accessToken,
      });
    } catch (e) {
      if (e instanceof OAuth2RequestError) {
        // Invalid authorization code, credentials, or redirect URI
        const code = e.code;
        // ...
      }
      if (e instanceof ArcticFetchError) {
        // Failed to call `fetch()`
        const cause = e.cause;
        // ...
      }
      // Parse error
      return c.json({ success: false, error: e.message });
    }
  })
  .post("/users", vValidator("json", v.object({ email: emailSchema })), c => {
    const data = c.req.valid("json");

    return c.json({
      success: true,
      message: `email is ${data.email}`,
    });
  });

export default app;
