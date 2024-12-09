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
import prisma from "./db/client";

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

    return c.redirect(url);
  })
  .get("/auth/github/callback", async c => {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = getCookie(c, state!);

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

      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });

      const githubUser = await githubUserResponse.json();

      const githubUserId = githubUser.id;
      const githubUsername = githubUser.login;

      // const claims = decodeIdToken(accessToken);
      // console.log("auth github callback claims", claims);

      // try to find user from db
      const existingUser = await prisma.user.findUnique({
        where: { github_id: githubUserId },
      });

      // if user already exists, create a session
      if (existingUser !== null) {
        // const sessionToken = generateSessionToken();
        // const session = await createSession(sessionToken, existingUser.id);
        // await setSessionTokenCookie(sessionToken, session.expiresAt);
        // cant i remove sessionToken & session, and generate an accessToken instead?
        // and then i return the accessToken to the client
        // and then in future requests, the client sends the accessToken in the Authorization header
        // the server will then verify the accessToken and extract data from it

        // if yes, what data should i put in the accessToken? only userId or more?

        return c.redirect("/");
      }

      // if user does not exist, create a new user in the db
      const user = await prisma.user.create({
        data: {
          github_id: githubUserId,
          username: githubUsername,
        },
      });

      // const sessionToken = generateSessionToken();
      // const session = await createSession(sessionToken, user.id);
      // await setSessionTokenCookie(sessionToken, session.expiresAt);

      return c.redirect("/");

      // return c.json({
      //   success: true,
      //   code,
      //   state,
      //   storedState,
      //   data,
      //   accessToken,
      // });
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
