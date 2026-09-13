import { Code2, GraduationCap, Handshake, Megaphone, type LucideIcon } from "lucide-react";

/** Icon per team title (see lib/teams.ts). Fall back to Megaphone for unknown titles. */
export const TEAM_ICONS: Record<string, LucideIcon> = {
  "Public Relations": Megaphone,
  "Academic & Technical Programs": GraduationCap,
  "Partnerships & Operations": Handshake,
  "IT & Digital Development": Code2,
};

export const FALLBACK_TEAM_ICON: LucideIcon = Megaphone;
