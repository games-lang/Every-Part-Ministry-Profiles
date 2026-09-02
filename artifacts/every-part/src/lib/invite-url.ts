export function buildInviteUrl(churchSlug: string, inviteToken: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams({ invite: inviteToken });
  return `${window.location.origin}${basePath}/profile/${encodeURIComponent(churchSlug)}?${params.toString()}`;
}