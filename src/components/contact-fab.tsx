import { Mail } from "lucide-react";
import { Magnetic } from "@/components/fx/magnetic";
import { mailto } from "@/lib/site";

/**
 * Floating "Email us" button pinned to the bottom-right corner of every page.
 * Opens the visitor's email app with a prefilled subject.
 */
export function ContactFab() {
  return (
    <div className="fixed right-5 bottom-5 z-50 sm:right-6 sm:bottom-6">
      <Magnetic strength={0.25}>
        <a
          href={mailto("ISACA Student Chapter - Alfaisal University")}
          aria-label="Email the ISACA Student Chapter at Alfaisal University"
          className="btn btn-primary btn-sm shadow-xl"
        >
          <Mail className="relative h-4 w-4" />
          <span className="relative hidden sm:inline">Email us</span>
        </a>
      </Magnetic>
    </div>
  );
}
