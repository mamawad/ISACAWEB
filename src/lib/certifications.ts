/**
 * ISACA credentials surfaced in the certification explorer. Descriptions stay
 * at the level of what each credential is for — exam details change and
 * belong on isaca.org, not here.
 */
export type CertDomain = "Foundations" | "Audit" | "Security" | "Risk" | "Governance" | "Privacy";

export type Certification = {
  code: string;
  name: string;
  domain: CertDomain;
  tagline: string;
  description: string;
  bestFor: string;
};

export const CERTIFICATIONS: Certification[] = [
  {
    code: "ITCA",
    name: "IT Certified Associate",
    domain: "Foundations",
    tagline: "The student-friendly starting line.",
    description:
      "ISACA's entry-level credential, made up of five fundamentals certificates: computing, networks and infrastructure, cybersecurity, software development, and data science. There is no experience requirement — it is built for people who are still studying.",
    bestFor:
      "First- and second-year students who want a recognised credential before their first internship.",
  },
  {
    code: "CISA",
    name: "Certified Information Systems Auditor",
    domain: "Audit",
    tagline: "The flagship. Audit, control, assurance.",
    description:
      "The most widely recognised ISACA certification, covering how information systems are audited, controlled, and assured. It is the credential IT audit and assurance teams look for first.",
    bestFor:
      "Anyone drawn to IT audit, compliance, or internal-control work — including accounting and business students.",
  },
  {
    code: "CISM",
    name: "Certified Information Security Manager",
    domain: "Security",
    tagline: "Running a security programme, not just a tool.",
    description:
      "Focused on the management side of information security: governance, risk, programme development, and incident management. It is aimed at people who will lead security, not only operate it.",
    bestFor: "Students who see themselves managing security teams or advising leadership.",
  },
  {
    code: "CRISC",
    name: "Certified in Risk and Information Systems Control",
    domain: "Risk",
    tagline: "Finding, measuring, and controlling IT risk.",
    description:
      "Covers identifying and assessing IT risk, designing and implementing controls, and monitoring them over time. It sits at the meeting point of technology and business decision-making.",
    bestFor:
      "Analytical students interested in risk, controls, and how technology decisions get justified.",
  },
  {
    code: "CGEIT",
    name: "Certified in the Governance of Enterprise IT",
    domain: "Governance",
    tagline: "Aligning IT with what the organisation is for.",
    description:
      "Addresses how enterprise IT is governed: strategic alignment, value delivery, resource and risk optimisation, and performance. It is the most senior-leaning of the ISACA credentials.",
    bestFor: "Students aiming at strategy, consulting, or board-level technology governance.",
  },
  {
    code: "CDPSE",
    name: "Certified Data Privacy Solutions Engineer",
    domain: "Privacy",
    tagline: "Privacy built into systems, not bolted on.",
    description:
      "A technical privacy certification covering privacy governance, architecture, and the data lifecycle — how to design systems that handle personal data responsibly from the start.",
    bestFor: "Engineering and data students who want privacy and data-protection expertise.",
  },
];

export const CERT_NOTE =
  "For the professional certifications, ISACA typically lets you sit the exam first and meet the experience requirement afterwards — so preparing as a student is a head start, not a waiting game.";
