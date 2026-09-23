import { z } from "zod";
import { isLeadershipRole, isValidSlotISO } from "./interview-slots";

export const YEAR_OPTIONS = [
  "Foundation / Pre-professional",
  "First year",
  "Second year",
  "Third year",
  "Fourth year",
  "Fifth year",
  "Sixth year",
  "Intern / Graduate",
  "Other",
] as const;

export const OTHER = "Other";

/**
 * Colleges at Alfaisal University and their undergraduate programs.
 * Names are kept short: the college already gives the context, so programs
 * drop the redundant "Engineering" suffix.
 */
export const COLLEGES = {
  Engineering: [
    "Architectural",
    "Artificial Intelligence",
    "Biomedical",
    "Cybersecurity",
    "Data Science",
    "Electrical",
    "Industrial",
    "Mechanical",
    "Software",
    OTHER,
  ],
  Business: [
    "Finance",
    "Management",
    "Human Resources",
    "Marketing",
    "Business Analytics",
    "Accounting",
    "Project Management",
    "Entrepreneurship",
    OTHER,
  ],
  Science: [
    "Life Sciences",
    "Life Sciences (Biological Sciences and Nanotechnology)",
    "Life Sciences (Environmental Sciences and Sustainability)",
    OTHER,
  ],
  "University Preparatory Program (UPP)": ["Undecided", OTHER],
  "Law and International Relations": [
    "Law (LLB)",
    "International Relations",
    OTHER,
  ],
  Medicine: ["Medicine and Surgery (MBBS)", OTHER],
  Other: [OTHER],
} as const;


export const COLLEGE_OPTIONS = Object.keys(COLLEGES) as [
  keyof typeof COLLEGES,
  ...(keyof typeof COLLEGES)[],
];

export type CollegeName = keyof typeof COLLEGES;

export const signupSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, { message: "Please enter your full name." })
      .max(100, { message: "Name must be under 100 characters." }),
    email: z
      .string()
      .trim()
      .min(1, { message: "Email is required." })
      .email({ message: "Please enter a valid email address." })
      .max(255, { message: "Email is too long." })
      .transform((v) => v.toLowerCase())
      .refine((v) => v.endsWith("@alfaisal.edu"), {
        message:
          "Please use your Alfaisal email address (ending in @alfaisal.edu).",
      }),
    student_id: z
      .string()
      .trim()
      .regex(/^(\d{6}|\d{9})$/, { message: "Student ID must be 6 or 9 digits." }),
    isaca_id: z
      .string()
      .trim()
      .max(7, { message: "ISACA ID must be 7 digits." })
      .regex(/^2\d{6}$/, {
        message: "ISACA ID must be a 7-digit code starting with 2.",
      })
      .optional()
      .or(z.literal("")),
    college: z.enum(COLLEGE_OPTIONS, {
      message: "Please select your college.",
    }),
    program: z
      .string()
      .trim()
      .min(1, { message: "Please select your program." })
      .max(120, { message: "Program name is too long." }),
    program_other: z
      .string()
      .trim()
      .max(120, { message: "Program name is too long." })
      .optional()
      .or(z.literal("")),
    year_of_study: z.enum(YEAR_OPTIONS, {
      message: "Please select your year of study.",
    }),
    preferred_team: z
      .string()
      .trim()
      .max(120, { message: "Team name is too long." })
      .optional()
      .or(z.literal("")),
    preferred_role: z
      .string()
      .trim()
      .max(120, { message: "Role name is too long." })
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(40, { message: "Phone number is too long." })
      .optional()
      .or(z.literal("")),
    reason: z
      .string()
      .trim()
      .max(1000, { message: "Please keep this under 1000 characters." })
      .optional()
      .or(z.literal("")),
    interview_slot: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
  })
  .refine((v) => v.program !== OTHER || !!v.program_other?.trim(), {
    message: "Please type your program.",
    path: ["program_other"],
  })
  .refine(
    (v) => {
      if (!isLeadershipRole(v.preferred_role)) return true;
      return !!v.interview_slot && isValidSlotISO(v.interview_slot);
    },
    {
      message: "Please pick an available interview slot.",
      path: ["interview_slot"],
    },
  );

export type SignupInput = z.infer<typeof signupSchema>;

/** The program value to store: the typed value when "Other" was picked. */
export function resolveProgram(input: SignupInput): string {
  return input.program === OTHER && input.program_other
    ? input.program_other
    : input.program;
}

export type SignupRow = {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  isaca_id: string | null;
  college: string | null;
  program: string | null;
  major: string;
  year_of_study: string;
  preferred_team: string | null;
  preferred_role: string | null;
  phone: string | null;
  reason: string | null;
  interview_slot: string | null;
  created_at: string;
  /** When the alert email for this application was successfully sent. */
  notified_at: string | null;
  /** When a calendar invite was created for this interview. */
  invite_sent_at: string | null;
};

