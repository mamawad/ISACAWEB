/** Chapter-wide constants: identity, contact, and outbound links. */
export const SITE = {
  name: "ISACA Student Chapter, Alfaisal University",
  shortName: "ISACA · Alfaisal",
  email: "isaca@alfaisal.edu",
  riyadhChapterUrl: "https://engage.isaca.org/riyadhchapter/home",
  isacaUrl: "https://www.isaca.org",
  socials: [
    {
      label: "Instagram",
      handle: "@AU.ISACA",
      href: "https://instagram.com/AU.ISACA",
    },
    {
      label: "TikTok",
      handle: "@au.isaca",
      href: "https://tiktok.com/@au.isaca",
    },
    {
      label: "LinkedIn",
      handle: "ISACA-AU",
      href: "https://linkedin.com/company/ISACA-AU",
    },
  ],
} as const;

export function mailto(subject: string): string {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;
}
