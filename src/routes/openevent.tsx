import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/openevent")({
  head: () => ({
    meta: [
      { title: "Opening Event · ISACA Alfaisal Student Chapter" },
      {
        name: "description",
        content: "Opening event presentation for the ISACA Student Chapter at Alfaisal University.",
      },
      { property: "og:title", content: "ISACA Alfaisal Student Chapter Opening Event" },
      {
        property: "og:description",
        content: "The opening event presentation for the ISACA Student Chapter at Alfaisal University.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpenEventPage,
});

function OpenEventPage() {
  return (
    <iframe
      src="/isaca-alfaisal-opening.html"
      title="ISACA Alfaisal Student Chapter opening event presentation"
      className="fixed inset-0 h-dvh w-full border-0 bg-navy-deep"
      allow="fullscreen"
    />
  );
}