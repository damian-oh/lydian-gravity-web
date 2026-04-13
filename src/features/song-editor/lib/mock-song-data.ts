export type SectionType = "A" | "B" | "C" | "D";

export type ChordSuggestion = Readonly<{
  id: string;
  chordName: string;
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

export const demoSong: SongSketchModel = {
  id: "1",
  userId: 1,
  title: "Northern Aperture",
  masterTonalCenter: "C",
  masterMode: "lydian",
  tempoBpm: 112,
  timeSignature: "4/4",
  notes:
    "A wide-open synth-pop verse that keeps its lift by orbiting around C Lydian before briefly borrowing brighter and darker colors.",
  createdAt: "2026-04-12T09:00:00Z",
  updatedAt: "2026-04-12T10:15:00Z",
  sections: [
    {
      id: 101,
      songSketchId: 1,
      sectionType: "A",
      label: "Verse 1",
      orderIndex: 0,
      totalBeats: 16,
      chords: [
        {
          id: 1001,
          sectionId: 101,
          orderIndex: 0,
          root: "C",
          quality: "maj7",
          chordName: "Cmaj7(#11)",
          notes: ["C", "E", "G", "B", "F#"],
          startBeat: 0,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1002,
          sectionId: 101,
          orderIndex: 1,
          root: "D",
          quality: "maj",
          chordName: "D",
          notes: ["D", "F#", "A"],
          startBeat: 4,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1003,
          sectionId: 101,
          orderIndex: 2,
          root: "A",
          quality: "min7",
          chordName: "Am7",
          notes: ["A", "C", "E", "G"],
          startBeat: 8,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1004,
          sectionId: 101,
          orderIndex: 3,
          root: "G",
          quality: "maj",
          chordName: "G",
          notes: ["G", "B", "D"],
          startBeat: 12,
          durationBeats: 4,
          parentMode: "lydian",
        },
      ],
      melodicNotes: [
        { id: 2001, sectionId: 101, pitch: 67, startBeat: 0, durationBeats: 1.5 },
        { id: 2002, sectionId: 101, pitch: 69, startBeat: 1.5, durationBeats: 1 },
        { id: 2003, sectionId: 101, pitch: 71, startBeat: 3, durationBeats: 1 },
        { id: 2004, sectionId: 101, pitch: 74, startBeat: 4, durationBeats: 2 },
        { id: 2005, sectionId: 101, pitch: 72, startBeat: 8, durationBeats: 1.5 },
        { id: 2006, sectionId: 101, pitch: 69, startBeat: 12, durationBeats: 2 },
      ],
      theory: {
        pitchCollection: ["C", "D", "E", "F#", "G", "A", "B"],
        gravityCenter: ["C", "G", "D", "A"],
        suggestedChords: [
          {
            id: "verse-1",
            chordName: "Em7",
            reason: "Keeps the raised fourth in play while softening the landing.",
            tension: "grounded",
          },
          {
            id: "verse-2",
            chordName: "Bm7",
            reason: "Adds lift before the pre-chorus without leaving the parent mode.",
            tension: "lift",
          },
          {
            id: "verse-3",
            chordName: "F",
            reason: "Borrowed color if you want the verse to darken for one bar.",
            tension: "borrowed",
          },
        ],
        melodyPrompt:
          "Hold E or B across the bar line, then answer with a quick F# to expose the lydian color.",
        rhythmicPrompt:
          "Keep the verse sparse: long tones on beats 1 and 3, shorter pickups into the next chord.",
        interchangeInsight:
          "A borrowed F major chord would read as parallel Ionian material against the C Lydian home base.",
      },
    },
    {
      id: 102,
      songSketchId: 1,
      sectionType: "B",
      label: "Pre-Chorus",
      orderIndex: 1,
      totalBeats: 16,
      chords: [
        {
          id: 1101,
          sectionId: 102,
          orderIndex: 0,
          root: "A",
          quality: "min7",
          chordName: "Am7",
          notes: ["A", "C", "E", "G"],
          startBeat: 0,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1102,
          sectionId: 102,
          orderIndex: 1,
          root: "B",
          quality: "min7",
          chordName: "Bm7",
          notes: ["B", "D", "F#", "A"],
          startBeat: 4,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1103,
          sectionId: 102,
          orderIndex: 2,
          root: "F",
          quality: "maj",
          chordName: "F",
          notes: ["F", "A", "C"],
          startBeat: 8,
          durationBeats: 4,
          parentMode: "ionian",
        },
        {
          id: 1104,
          sectionId: 102,
          orderIndex: 3,
          root: "G",
          quality: "sus4",
          chordName: "Gsus4",
          notes: ["G", "C", "D"],
          startBeat: 12,
          durationBeats: 4,
          parentMode: "lydian",
        },
      ],
      melodicNotes: [
        { id: 2101, sectionId: 102, pitch: 69, startBeat: 0, durationBeats: 1 },
        { id: 2102, sectionId: 102, pitch: 71, startBeat: 2, durationBeats: 1 },
        { id: 2103, sectionId: 102, pitch: 74, startBeat: 4, durationBeats: 2 },
        { id: 2104, sectionId: 102, pitch: 76, startBeat: 8, durationBeats: 1.5 },
        { id: 2105, sectionId: 102, pitch: 74, startBeat: 10, durationBeats: 1 },
        { id: 2106, sectionId: 102, pitch: 72, startBeat: 13, durationBeats: 2 },
      ],
      theory: {
        pitchCollection: ["C", "D", "E", "F#", "G", "A", "B"],
        gravityCenter: ["A", "D", "G", "C"],
        suggestedChords: [
          {
            id: "pre-1",
            chordName: "D/C",
            reason: "Suspended bass keeps momentum and points upward.",
            tension: "lift",
          },
          {
            id: "pre-2",
            chordName: "F",
            reason: "Parallel Ionian borrow intensifies the arrival into chorus.",
            tension: "borrowed",
          },
          {
            id: "pre-3",
            chordName: "Gadd9",
            reason: "A brighter dominant-adjacent shape before release.",
            tension: "release",
          },
        ],
        melodyPrompt:
          "Climb from A to E, then let a short descending answer soften the borrowed F.",
        rhythmicPrompt:
          "Shorten the note values in bars three and four so the chorus feels wider by contrast.",
        interchangeInsight:
          "The F major bar is modal interchange from C Ionian, which briefly collapses the raised fourth tension.",
      },
    },
    {
      id: 103,
      songSketchId: 1,
      sectionType: "C",
      label: "Chorus",
      orderIndex: 2,
      totalBeats: 16,
      chords: [
        {
          id: 1201,
          sectionId: 103,
          orderIndex: 0,
          root: "C",
          quality: "maj9",
          chordName: "Cmaj9(#11)",
          notes: ["C", "E", "G", "B", "D", "F#"],
          startBeat: 0,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1202,
          sectionId: 103,
          orderIndex: 1,
          root: "G",
          quality: "maj",
          chordName: "G",
          notes: ["G", "B", "D"],
          startBeat: 4,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1203,
          sectionId: 103,
          orderIndex: 2,
          root: "D",
          quality: "maj",
          chordName: "D",
          notes: ["D", "F#", "A"],
          startBeat: 8,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1204,
          sectionId: 103,
          orderIndex: 3,
          root: "A",
          quality: "min7",
          chordName: "Am7",
          notes: ["A", "C", "E", "G"],
          startBeat: 12,
          durationBeats: 4,
          parentMode: "lydian",
        },
      ],
      melodicNotes: [
        { id: 2201, sectionId: 103, pitch: 72, startBeat: 0, durationBeats: 1 },
        { id: 2202, sectionId: 103, pitch: 76, startBeat: 1, durationBeats: 2 },
        { id: 2203, sectionId: 103, pitch: 78, startBeat: 4, durationBeats: 2 },
        { id: 2204, sectionId: 103, pitch: 79, startBeat: 8, durationBeats: 1.5 },
        { id: 2205, sectionId: 103, pitch: 76, startBeat: 10.5, durationBeats: 1.5 },
        { id: 2206, sectionId: 103, pitch: 74, startBeat: 13, durationBeats: 2 },
      ],
      theory: {
        pitchCollection: ["C", "D", "E", "F#", "G", "A", "B"],
        gravityCenter: ["C", "G", "D", "E"],
        suggestedChords: [
          {
            id: "chorus-1",
            chordName: "Emin7",
            reason: "Lets the chorus stay airborne while preserving the tonal center.",
            tension: "grounded",
          },
          {
            id: "chorus-2",
            chordName: "D/C",
            reason: "Pedal-point color that keeps the refrain suspended.",
            tension: "lift",
          },
          {
            id: "chorus-3",
            chordName: "A7sus4",
            reason: "A wider dominant-like color before cycling back home.",
            tension: "release",
          },
        ],
        melodyPrompt:
          "Aim the hook at E and F# first, then let C arrive late as the emotional resolution.",
        rhythmicPrompt:
          "Use fewer rests than the verse and let the hook begin before beat 1 for lift.",
      },
    },
    {
      id: 104,
      songSketchId: 1,
      sectionType: "D",
      label: "Bridge",
      orderIndex: 3,
      totalBeats: 16,
      chords: [
        {
          id: 1301,
          sectionId: 104,
          orderIndex: 0,
          root: "E",
          quality: "min7",
          chordName: "Em7",
          notes: ["E", "G", "B", "D"],
          startBeat: 0,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1302,
          sectionId: 104,
          orderIndex: 1,
          root: "B",
          quality: "min7",
          chordName: "Bm7",
          notes: ["B", "D", "F#", "A"],
          startBeat: 4,
          durationBeats: 4,
          parentMode: "lydian",
        },
        {
          id: 1303,
          sectionId: 104,
          orderIndex: 2,
          root: "F",
          quality: "maj7",
          chordName: "Fmaj7",
          notes: ["F", "A", "C", "E"],
          startBeat: 8,
          durationBeats: 4,
          parentMode: "ionian",
        },
        {
          id: 1304,
          sectionId: 104,
          orderIndex: 3,
          root: "G",
          quality: "maj",
          chordName: "G",
          notes: ["G", "B", "D"],
          startBeat: 12,
          durationBeats: 4,
          parentMode: "lydian",
        },
      ],
      melodicNotes: [
        { id: 2301, sectionId: 104, pitch: 71, startBeat: 0, durationBeats: 1.5 },
        { id: 2302, sectionId: 104, pitch: 74, startBeat: 2, durationBeats: 1 },
        { id: 2303, sectionId: 104, pitch: 76, startBeat: 4, durationBeats: 1.5 },
        { id: 2304, sectionId: 104, pitch: 77, startBeat: 8, durationBeats: 2 },
        { id: 2305, sectionId: 104, pitch: 74, startBeat: 11, durationBeats: 1 },
        { id: 2306, sectionId: 104, pitch: 72, startBeat: 13, durationBeats: 2 },
      ],
      theory: {
        pitchCollection: ["C", "D", "E", "F#", "G", "A", "B"],
        gravityCenter: ["E", "B", "F#", "C"],
        suggestedChords: [
          {
            id: "bridge-1",
            chordName: "Fmaj7",
            reason: "The deliberate non-lydian color resets the listener's ear.",
            tension: "borrowed",
          },
          {
            id: "bridge-2",
            chordName: "G6",
            reason: "Prepares the chorus return without sounding final too early.",
            tension: "release",
          },
          {
            id: "bridge-3",
            chordName: "Cmaj7(#11)",
            reason: "Return target once the contrast has done its work.",
            tension: "grounded",
          },
        ],
        melodyPrompt:
          "Let the melody widen into the upper register, then step down into the last G chord.",
        rhythmicPrompt:
          "Bridge phrasing can be denser than the verse, but leave beat 4 open for the return.",
        interchangeInsight:
          "Fmaj7 is the strongest modal interchange moment in the arrangement and should feel intentional rather than accidental.",
      },
    },
  ],
};

export function getDemoSongById(songId: string) {
  if (songId === demoSong.id) {
    return demoSong;
  }

  return null;
}
