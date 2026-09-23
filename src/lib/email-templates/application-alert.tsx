import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  fullName?: string;
  email?: string;
  studentId?: string;
  isacaId?: string;
  college?: string;
  program?: string;
  yearOfStudy?: string;
  preferredTeam?: string;
  preferredRole?: string;
  interviewSlot?: string;
  phone?: string;
  reason?: string;
  adminUrl?: string;
}

const NAVY = "#1e3a5f";
const TEAL = "#0d9488";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

function Field({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <Section style={{ marginBottom: "8px" }}>
      <Text style={{ margin: 0, fontSize: "12px", color: MUTED, fontWeight: 600 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ margin: "2px 0 0", fontSize: "15px", color: "#1e293b" }}>
        {value || "—"}
      </Text>
    </Section>
  );
}

const Email = ({
  fullName,
  email,
  studentId,
  isacaId,
  college,
  program,
  yearOfStudy,
  preferredTeam,
  preferredRole,
  interviewSlot,
  phone,
  reason,
  adminUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New membership application from {fullName || "a student"}</Preview>
    <Body style={{ backgroundColor: "#ffffff", fontFamily: "Manrope, Arial, sans-serif" }}>
      <Container style={{ padding: "24px 20px", maxWidth: "560px" }}>
        <Section
          style={{
            backgroundColor: NAVY,
            borderRadius: "10px 10px 0 0",
            padding: "20px 24px",
          }}
        >
          <Text style={{ margin: 0, color: "#ffffff", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em" }}>
            ALFAISAL ISACA CONNECT
          </Text>
          <Heading style={{ margin: "8px 0 0", color: "#ffffff", fontSize: "22px", fontWeight: 700 }}>
            New Membership Application
          </Heading>
        </Section>

        <Section
          style={{
            border: `1px solid ${BORDER}`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "24px",
          }}
        >
          <Field label="Full Name" value={fullName} />
          <Field label="Email" value={email} />
          <Field label="Student ID" value={studentId} />
          <Field label="ISACA ID" value={isacaId} />
          <Field label="College" value={college} />
          <Field label="Program" value={program} />
          <Field label="Year of Study" value={yearOfStudy} />
          <Field label="Preferred Team" value={preferredTeam} />
          <Field label="Preferred Role" value={preferredRole} />
          <Field label="Interview Slot" value={interviewSlot} />
          <Field label="Phone" value={phone} />
          <Field label="Reason for Joining" value={reason} />

          <Hr style={{ margin: "20px 0", borderColor: BORDER }} />

          <Text style={{ margin: 0, fontSize: "14px", color: "#1e293b" }}>
            Review all applications in the admin dashboard:
          </Text>
          <Link
            href={adminUrl || "/admin"}
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: TEAL,
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to /admin
          </Link>
        </Section>

        <Text style={{ margin: "16px 0 0", fontSize: "12px", color: MUTED, textAlign: "center" }}>
          ISACA Student Chapter — Alfaisal University
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `New application from ${data["fullName"] || "a student"}`,
  displayName: "Application Alert",
  previewData: {
    fullName: "Sample Student",
    email: "sample@alfaisal.edu",
    studentId: "219000",
    isacaId: "2123456",
    college: "Engineering",
    program: "Cybersecurity",
    yearOfStudy: "Third year",
    preferredTeam: "Public Relations",
    preferredRole: "Director",
    interviewSlot: "Sun Sep 6, 12:00–12:10 (Riyadh)",
    phone: "+966 5x xxx xxxx",
    reason: "I want to grow my network in IT governance.",
    adminUrl: "/admin",
  },
} satisfies TemplateEntry;
