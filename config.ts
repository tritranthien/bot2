export type Config = {
  prefix?: string;
  modLogChannel?: string;
  mutedRole?: string; 
  sonId?: string;
  camGif?: string;
  aiChannel?: string;
  repoPath?: string;
  channeSpamSettingKey?: string;
  electricTargetKey?: string;
}

export const config: Config = {
  prefix: "!",
  modLogChannel: "mod-logs",
  mutedRole: "Muted",
  sonId: "1349637201666768898",
  camGif: "a:campuchigif:1352142676056735764",
  aiChannel: "1354298788004761641",
  repoPath: process.env.REPO_PATH || "mongodb",
  channeSpamSettingKey: 'channel_spam_bot',
  electricTargetKey: 'electric_target_id'
}
