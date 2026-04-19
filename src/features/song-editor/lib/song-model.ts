export type SectionType = "A" | "B" | "C" | "D";

export type ChordSuggestion = Readonly<{
  id: string;
  chordName: string;
  root?: string;
  quality?: string;
  notes?: readonly string[];
  parentMode?: string;
  reason: string;
  tension: "grounded" | "lift" | "borrowed" | "release";
}>;

export type SongChord = Readonly<{
  id: number;
  sectionId: number;
  orderIndex: number;
  root: string;
  quality: string;
  chordName: string;
  notes: readonly string[];
  startBeat: number;
  durationBeats: number;
  parentMode: string;
}>;

export type MelodicNoteModel = Readonly<{
  id: number;
  sectionId: number;
  pitch: number;
  startBeat: number;
  durationBeats: number;
}>;

export type SectionTheoryModel = Readonly<{
  pitchCollection: readonly string[];
  gravityCenter: readonly string[];
  suggestedChords: readonly ChordSuggestion[];
  melodyPrompt: string;
  rhythmicPrompt: string;
  interchangeInsight?: string;
}>;

export type SongSectionModel = Readonly<{
  id: number;
  songSketchId: number;
  sectionType: SectionType;
  label: string;
  orderIndex: number;
  totalBeats: number;
  chords: readonly SongChord[];
  melodicNotes: readonly MelodicNoteModel[];
  theory: SectionTheoryModel;
}>;

export type SongSketchModel = Readonly<{
  id: string;
  userId: number;
  title: string;
  masterTonalCenter: string;
  masterMode: string;
  tempoBpm: number;
  timeSignature: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  sections: readonly SongSectionModel[];
}>;

export type SongSummaryModel = Readonly<{
  id: string;
  title: string;
  masterTonalCenter: string;
  masterMode: string;
  tempoBpm: number;
  timeSignature: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
}>;

export const emptySectionTheory: SectionTheoryModel = {
  pitchCollection: [],
  gravityCenter: [],
  suggestedChords: [],
  melodyPrompt: "Add melodic context to request a next-step idea.",
  rhythmicPrompt: "Save the section, then ask for a rhythmic next step.",
};
