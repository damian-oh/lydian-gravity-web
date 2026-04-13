import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SongEditorWorkspace } from "@/features/song-editor/components/song-editor-workspace";
import { getDemoSongById } from "@/features/song-editor/lib/mock-song-data";

type SongPageProps = Readonly<{
  params: Promise<{
    songId: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: SongPageProps): Promise<Metadata> {
  const { songId } = await params;
  const song = getDemoSongById(songId);

  if (!song) {
    return {
      title: "Song Not Found | Lydian Gravity",
      description: "The requested song could not be found.",
    };
  }

  return {
    title: `${song.title} | Lydian Gravity`,
    description:
      "Open the songwriting editor with section switching, theory cues, and preview controls.",
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { songId } = await params;
  const song = getDemoSongById(songId);

  if (!song) {
    notFound();
  }

  return <SongEditorWorkspace song={song} />;
}
