import { GitHub } from "arctic";

const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_SECRET_ID!,
  process.env.GITHUB_REDIRECT_URI!
);

export default github;
