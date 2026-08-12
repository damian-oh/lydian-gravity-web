import type {
  MelodicNoteModel,
  SongChord,
} from "@/features/song-editor/lib/song-model";

export type MelodyGravityClass =
  | "anchor"
  | "stable"
  | "color"
  | "tension"
  | "outside";

export type MelodyGravityResult = Readonly<{
  pitchClass: string;
  supportingChord: SongChord | null;
  gravityClass: MelodyGravityClass;
  score: number;
  label: string;
  intervalToChord: string;
  intervalToTonic: string;
  explanation: string;
}>;

type ModeName =
  | "lydian"
  | "ionian"
  | "dorian"
  | "mixolydian"
  | "aeolian"
  | "phrygian"
  | "locrian";

const supportedModes: readonly ModeName[] = [
  "lydian",
  "ionian",
  "dorian",
  "mixolydian",
  "aeolian",
  "phrygian",
  "locrian",
] as const;

const modeIntervalsByName: Readonly<Record<ModeName, readonly number[]>> = {
  lydian: [0, 2, 4, 6, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

const noteToSemitone: Readonly<Record<string, number>> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

export const pitchClassOptions = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

const intervalLabelBySemitone: Readonly<Record<number, string>> = {
  0: "1",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "#4 / b5",
  7: "5",
  8: "#5 / b6",
  9: "6",
  10: "b7",
  11: "7",
};

function normalizeSemitone(value: number) {
  return ((value % 12) + 12) % 12;
}

function formatModeLabel(mode: string) {
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

function getModeIntervals(mode: string) {
  return modeIntervalsByName[
    (supportedModes.includes(mode as ModeName) ? mode : "ionian") as ModeName
  ];
}

function buildModePitchCollection(tonalCenter: string, mode: string) {
  // Works purely in semitone classes; note spelling (the chord catalog's
  // concern) never affects gravity math.
  const baseSemitone = noteToSemitone[tonalCenter] ?? 0;

  return new Set(
    getModeIntervals(mode).map((interval) =>
      normalizeSemitone(baseSemitone + interval),
    ),
  );
}

function getClosestDistanceToSet(
  pitchSemitone: number,
  targetSemitones: Iterable<number>,
) {
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const targetSemitone of targetSemitones) {
    const upwardDistance = normalizeSemitone(targetSemitone - pitchSemitone);
    const downwardDistance = normalizeSemitone(pitchSemitone - targetSemitone);
    const distance = Math.min(upwardDistance, downwardDistance);

    closestDistance = Math.min(closestDistance, distance);
  }

  return closestDistance;
}

function getIntervalLabel(fromSemitone: number, toSemitone: number) {
  return (
    intervalLabelBySemitone[normalizeSemitone(toSemitone - fromSemitone)] ?? "1"
  );
}

function findSupportingChord(chords: readonly SongChord[], startBeat: number) {
  return (
    chords.find(
      (chord) =>
        startBeat >= chord.startBeat &&
        startBeat < chord.startBeat + chord.durationBeats,
    ) ?? null
  );
}

export function pitchClassToSemitone(pitchClass: string) {
  return noteToSemitone[pitchClass] ?? 0;
}

export function midiToPitchClass(pitch: number) {
  return pitchClassOptions[normalizeSemitone(pitch)];
}

export function midiToNoteName(pitch: number) {
  const octave = Math.floor(pitch / 12) - 1;

  return `${midiToPitchClass(pitch)}${octave}`;
}

export function analyzeMelodyNoteGravity(
  note: MelodicNoteModel,
  chords: readonly SongChord[],
  masterTonalCenter: string,
  masterMode: string,
): MelodyGravityResult {
  const pitchClass = midiToPitchClass(note.pitch);
  const pitchSemitone = normalizeSemitone(note.pitch);
  const tonicSemitone = pitchClassToSemitone(masterTonalCenter);
  const supportingChord = findSupportingChord(chords, note.startBeat);
  const supportingChordRootSemitone = supportingChord
    ? pitchClassToSemitone(supportingChord.root)
    : tonicSemitone;
  const chordToneSemitones = new Set(
    supportingChord?.notes.map((chordNote) =>
      pitchClassToSemitone(chordNote),
    ) ?? [],
  );
  const scaleSemitones = buildModePitchCollection(
    masterTonalCenter,
    masterMode,
  );
  const inChord = chordToneSemitones.has(pitchSemitone);
  const inScale = scaleSemitones.has(pitchSemitone);
  const isTonic = pitchSemitone === tonicSemitone;
  const isChordRoot =
    supportingChord !== null && pitchSemitone === supportingChordRootSemitone;
  const closestScaleDistance = getClosestDistanceToSet(
    pitchSemitone,
    scaleSemitones,
  );
  const closestChordDistance =
    chordToneSemitones.size > 0
      ? getClosestDistanceToSet(pitchSemitone, chordToneSemitones)
      : Number.POSITIVE_INFINITY;

  if (isTonic) {
    return {
      pitchClass,
      supportingChord,
      gravityClass: "anchor",
      score: 98,
      label: "Tonic anchor",
      intervalToChord: supportingChord
        ? getIntervalLabel(supportingChordRootSemitone, pitchSemitone)
        : "Open",
      intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
      explanation: `${pitchClass} matches the tonal center, so it reads as the strongest point of rest against ${
        supportingChord?.chordName ?? "the open bar"
      }.`,
    };
  }

  if (isChordRoot) {
    return {
      pitchClass,
      supportingChord,
      gravityClass: "anchor",
      score: 92,
      label: "Chord anchor",
      intervalToChord: getIntervalLabel(
        supportingChordRootSemitone,
        pitchSemitone,
      ),
      intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
      explanation: `${pitchClass} locks to the root of ${supportingChord?.chordName}, giving the line a grounded vertical landing even away from the tonic.`,
    };
  }

  if (inChord) {
    return {
      pitchClass,
      supportingChord,
      gravityClass: "stable",
      score: 82,
      label: "Chord tone",
      intervalToChord: getIntervalLabel(
        supportingChordRootSemitone,
        pitchSemitone,
      ),
      intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
      explanation: `${pitchClass} belongs to ${supportingChord?.chordName ?? "the active harmony"}, so it reads as structurally stable.`,
    };
  }

  if (inScale) {
    return {
      pitchClass,
      supportingChord,
      gravityClass: "color",
      score: 66,
      label: "Modal color",
      intervalToChord: supportingChord
        ? getIntervalLabel(supportingChordRootSemitone, pitchSemitone)
        : "Open",
      intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
      explanation: `${pitchClass} stays inside ${masterTonalCenter} ${formatModeLabel(masterMode)} but sits outside ${
        supportingChord?.chordName ?? "the current chord slot"
      }, so it reads as color rather than rest.`,
    };
  }

  if (closestScaleDistance === 1 || closestChordDistance === 1) {
    return {
      pitchClass,
      supportingChord,
      gravityClass: "tension",
      score: 38,
      label: "Chromatic tension",
      intervalToChord: supportingChord
        ? getIntervalLabel(supportingChordRootSemitone, pitchSemitone)
        : "Open",
      intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
      explanation: `${pitchClass} sits a half-step away from the current collection, so it creates immediate pull for a nearby resolution.`,
    };
  }

  return {
    pitchClass,
    supportingChord,
    gravityClass: "outside",
    score: 18,
    label: "Outside color",
    intervalToChord: supportingChord
      ? getIntervalLabel(supportingChordRootSemitone, pitchSemitone)
      : "Open",
    intervalToTonic: getIntervalLabel(tonicSemitone, pitchSemitone),
    explanation: `${pitchClass} sits outside both ${masterTonalCenter} ${formatModeLabel(masterMode)} and ${
      supportingChord?.chordName ?? "the open bar"
    }, so it reads as the loosest vertical color.`,
  };
}

export function buildMelodyGravityMap(
  melodicNotes: readonly MelodicNoteModel[],
  chords: readonly SongChord[],
  masterTonalCenter: string,
  masterMode: string,
) {
  return new Map(
    melodicNotes.map((note) => [
      note.id,
      analyzeMelodyNoteGravity(note, chords, masterTonalCenter, masterMode),
    ]),
  );
}
