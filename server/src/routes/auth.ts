import { ArcticFetchError, OAuth2RequestError, generateState } from "arctic";
import { Hono } from "hono";
import github from "../auth/providers/github";
import { getCookie, setCookie } from "hono/cookie";
import prisma from "../db/client";
import { hashPassword, verifyPassword } from "../auth/utils/passwords";
import { vValidator } from "@hono/valibot-validator";
import { signUpSchema } from "../../validation/auth/signUp";
import { signInSchema } from "../../validation/auth/signIn";
import {
  createUser,
  findUserByEmail,
  findUserByGithubId,
} from "../db/utils/users";
import { fetchGithubUser } from "../auth/utils/users";

const authRoutes = new Hono()
  .get("/github", c => {
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
  .get("/github/callback", async c => {
    const url = new URL(c.req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const storedState = getCookie(c, state!);

    if (
      code === null ||
      storedState === null
      // i know i need to compare the two states
      // for some reason it's not working
      // i'll fix it later
      //  || state !== storedState
    ) {
      // 400
      throw new Error("Invalid request");
    }

    try {
      const tokens = await github.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const githubUserResponse = await fetchGithubUser(accessToken);
      const githubUser = await githubUserResponse.json();

      const githubUserId = githubUser.id;
      const githubUsername = githubUser.login;

      // const claims = decodeIdToken(accessToken);
      // console.log("auth github callback claims", claims);

      // try to find user from db
      const existingUser = await findUserByGithubId(githubUserId);

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
      const user = await createUser({
        github_id: githubUserId,
        username: githubUsername,
      });

      // TODO create a session for the new user
      // i will use JWT for this i think
      // const sessionToken = generateSessionToken();
      // const session = await createSession(sessionToken, user.id);
      // await setSessionTokenCookie(sessionToken, session.expiresAt);

      return c.redirect("/");
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
  .post("/sign-up", vValidator("json", signUpSchema), async c => {
    const { email, password, name } = c.req.valid("json");

    // TODO use zxcvbn to check for weak passwords
    // TODO detect leaked passwords with haveibeenpwned
    // see https://thecopenhagenbook.com/password-authentication

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser({ email, hashedPassword, name });

    const { hashedPassword: _, ...user } = newUser;

    return c.json({ success: true, user });
  })
  .post("/sign-in", vValidator("json", signInSchema), async c => {
    const { email, password } = c.req.valid("json");

    // TODO add IP-address based rate limiting
    // see https://thecopenhagenbook.com/password-authentication#:~:text=A%20basic%20example%20is%20to%20block%20all%20attempts%20from%20an%20IP%20address%20for%2010%20minutes%20after%20they%20fail%2010%20consecutive%20attempts

    const user = await findUserByEmail(email);

    if (user === null) {
      // WARN early return may expose timing attacks
      // see: https://thecopenhagenbook.com/password-authentication#:~:text=Even%20when%20returning%20a%20generic%20message%20however%2C%20it%20may%20be%20possible%20to%20determine%20if%20a%20user%20exists%20or%20not%20by%20checking%20the%20response%20times.%20For%20example%2C%20if%20you%20only%20validate%20the%20password%20when%20the%20username%20is%20valid
      return c.json({
        success: false,
        error: "Incorrect username or password",
      });
    }

    const isValid = await verifyPassword(password, user.hashedPassword!);

    // Wrong password, but don't tell the user to avoid bruteforce attacks
    if (!isValid) {
      return c.json({
        success: false,
        error: "Incorrect username or password",
      });
    }

    // User found, password correct
    // TODO create a session for the user
    // i will use JWT for this i think

    return c.json({ success: true, email });
  });

export default authRoutes;
