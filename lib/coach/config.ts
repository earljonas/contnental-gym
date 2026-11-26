import "server-only";

export function getCoachProvider() {
  const provider = process.env.COACH_PROVIDER;
  return provider === "ollama" || provider === "groq" || provider === "openai" ? provider : null;
}

export function coachEnabledFor(memberId: string) {
  if (!getCoachProvider()) return false;
  return process.env.COACH_ALLOW_ALL_MEMBERS === "true"
    || (process.env.COACH_MEMBER_IDS ?? "").split(",").some((id) => id.trim() === memberId);
}
