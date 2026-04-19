import type { Metadata } from "next";

import { SongEditorLoader } from "@/features/song-editor/components/song-editor-loader";

type SongPageProps = Readonly<{
  params: Promise<{
    songId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "Song Editor | Lydian Gravity",
  description:
    "Open the songwriting editor with section switching, theory cues, and preview controls.",
};

export default async function SongPage({ params }: SongPageProps) {
  const { songId } = await params;

  return <SongEditorLoader songId={songId} />;
}
