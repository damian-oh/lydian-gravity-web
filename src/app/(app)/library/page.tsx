import type { Metadata } from "next";

import { LibraryDashboard } from "@/features/library/components/library-dashboard";

export const metadata: Metadata = {
  title: "Library | Lydian Gravity",
  description: "Browse sketches and open arrangements from the song library.",
};

export default function LibraryPage() {
  return <LibraryDashboard />;
}
