interface Config {
  prefix: string;
  modLogChannel: string;
  mutedRole: string;
  sonId: string;
  camGif: string;
  aiChannel: string;
  repoPath: string;
}

export const config: Config = {
  prefix: "!",
  modLogChannel: "mod-logs",
  mutedRole: "Muted",
  sonId: "1349637201666768898",
  camGif: "a:campuchigif:1352142676056735764",
  aiChannel: "1354298788004761641",
  repoPath: process.env.REPO_PATH || "postgresql"
}
