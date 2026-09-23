export type Role = {
  title: string;
  responsibility: string;
};

export type Team = {
  title: string;
  description: string;
  directors: Role[];
  members: Role[];
};

export const NOT_SURE = "Not sure yet";
export const ANY_ROLE = "Any role in this team";

export const TEAMS: Team[] = [
  {
    title: "Public Relations",
    description:
      "Shapes how the chapter looks and sounds to the outside world.",
    directors: [
      {
        title: "Director of Public Relations",
        responsibility:
          "Leads the chapter's social media presence, event promotion, and overall branding strategy.",
      },
      {
        title: "Associate Director of Public Relations",
        responsibility:
          "Supports the Director on content production, covering design, photography, and video for events and posts.",
      },
    ],
    members: [
      {
        title: "Graphic Design Member",
        responsibility:
          "Designs flyers, social posts, and presentation decks for chapter events.",
      },
      {
        title: "Photography Member",
        responsibility:
          "Captures photos at chapter events and meetings for socials and recaps.",
      },
      {
        title: "Video Editing Member",
        responsibility:
          "Edits event footage and short-form video for the chapter's social channels.",
      },
    ],
  },
  {
    title: "Academic & Technical Programs",
    description:
      "Runs the workshops, labs, and technical sessions members actually show up for.",
    directors: [
      {
        title: "Director of Academic & Technical Programs",
        responsibility:
          "Plans and runs workshops and hands-on technical training sessions.",
      },
      {
        title: "Associate Director of Academic & Technical Programs",
        responsibility:
          "Leads competition prep for CTFs and hackathons, and supports research initiatives.",
      },
    ],
    members: [
      {
        title: "Workshop Facilitator Member",
        responsibility:
          "Helps prepare and run hands-on labs and technical workshops.",
      },
      {
        title: "Research & Innovation Member",
        responsibility:
          "Supports research initiatives, technical projects, and opportunities that encourage members to explore cybersecurity, IT governance, emerging technologies, and innovation.",
      },
    ],
  },
  {
    title: "IT & Digital Development",
    description:
      "Builds and maintains the chapter's digital presence, from the website to internal tools.",
    directors: [
      {
        title: "Director of IT & Digital Development",
        responsibility:
          "Leads the chapter's web and digital projects, and oversees technical upkeep of chapter platforms.",
      },
      {
        title: "Associate Director of IT & Digital Development",
        responsibility:
          "Supports the Director on delivery, coordinating developers and keeping projects on track.",
      },
    ],
    members: [
      {
        title: "Web Development Member",
        responsibility:
          "Builds and maintains the chapter website and web tools.",
      },
      {
        title: "App Development Member",
        responsibility:
          "Works on mobile or internal app projects for the chapter.",
      },
    ],
  },
  {
    title: "Partnerships & Operations",
    description: "Keeps events resourced, hosted, and organized.",
    directors: [
      {
        title: "Director of Partnerships & Operations",
        responsibility:
          "Builds relationships with companies and organizations for sponsorships and partnerships, including venues, prizes, and guest speakers.",
      },
      {
        title: "Associate Director of Partnerships & Operations",
        responsibility:
          "Manages event logistics, membership records, and the chapter's day-to-day operations.",
      },
    ],
    members: [
      {
        title: "Sponsorship Outreach Member",
        responsibility:
          "Researches and reaches out to potential sponsors and partner organizations.",
      },
      {
        title: "Event Logistics Member",
        responsibility:
          "Helps plan and run events on the day, from venue setup to registration.",
      },
      {
        title: "Membership & Records Member",
        responsibility:
          "Keeps the member roster, attendance, and chapter communications up to date.",
      },
    ],
  },
];

export const TEAM_OPTIONS: string[] = [
  ...TEAMS.map((t) => t.title),
  NOT_SURE,
];

/** Roles a person can pick once they've chosen a team. */
export function rolesForTeam(team: string): string[] {
  const found = TEAMS.find((t) => t.title === team);
  if (!found) return [];
  return [
    ...found.directors.map((r) => r.title),
    ...found.members.map((r) => r.title),
    ANY_ROLE,
  ];
}
