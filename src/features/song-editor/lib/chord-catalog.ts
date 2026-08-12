"use client";

export type ChordCatalogTab =
  | "diatonic"
  | "secondaryDominant"
  | "modalInterchange";

export type ChordCatalogItem = Readonly<{
  id: string;
  category: ChordCatalogTab;
  chordName: string;
  root: string;
  quality: string;
  notes: readonly string[];
  parentMode: string;
  badges: readonly string[];
}>;

export type ChordCatalogGroup = Readonly<{
  id: string;
  label: string;
  description?: string;
  items: readonly ChordCatalogItem[];
}>;

export type ChordCatalog = Readonly<
  Record<ChordCatalogTab, readonly ChordCatalogGroup[]>
>;

type ModeName =
  | "lydian"
  | "ionian"
  | "dorian"
  | "mixolydian"
  | "aeolian"
  | "phrygian"
  | "locrian";

type SeventhChordQuality = "maj7" | "7" | "min7" | "min7b5";

type BuiltScaleChord = Readonly<{
  root: string;
  rootOffset: number;
  quality: SeventhChordQuality;
  chordName: string;
  notes: readonly string[];
  romanNumeral: string;
  degreeLabel: string;
}>;

const supportedModes: readonly ModeName[] = [
  "lydian",
  "ionian",
  "dorian",
  "mixolydian",
  "aeolian",
  "phrygian",
  "locrian",
];

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

const sharpChromatic = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const flatChromatic = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

const qualitySuffixMap: Readonly<Record<SeventhChordQuality, string>> = {
  maj7: "maj7",
  "7": "7",
  min7: "m7",
  min7b5: "m7b5",
};

const romanNumeralSuffixMap: Readonly<Record<SeventhChordQuality, string>> = {
  maj7: "maj7",
  "7": "7",
  min7: "7",
  min7b5: "ø7",
};

const scaleDegreeLabelByOffset: Readonly<Record<number, string>> = {
  0: "I",
  1: "bII",
  2: "II",
  3: "bIII",
  4: "III",
  5: "IV",
  7: "V",
  8: "bVI",
  9: "VI",
  10: "bVII",
  11: "VII",
};

// Semitone offset from a mode's tonic down to its relative major (ionian)
// tonic: D dorian shares its key signature with C major, so dorian maps to 2.
const modeTonicOffsets: Readonly<Record<ModeName, number>> = {
  ionian: 0,
  dorian: 2,
  phrygian: 4,
  lydian: 5,
  mixolydian: 7,
  aeolian: 9,
  locrian: 11,
};

// Semitone classes of the flat-side major keys F, Bb, Eb, Ab, and Db.
const flatMajorSemitones = new Set([5, 10, 3, 8, 1]);

function getPreferredChromatic(tonalCenter: string, mode = "ionian") {
  // The sharp/flat side of a key is a property of the key signature, which
  // depends on tonic AND mode: C dorian carries the two flats of Bb major.
  // Limitation: the 12-name tables cannot spell E#/B#/Cb/Fb or double
  // accidentals, so remote keys get single-accidental respellings. Must stay
  // in lockstep with the backend's music_theory.py.
  if (tonalCenter.includes("b")) {
    return flatChromatic;
  }

  if (tonalCenter.includes("#")) {
    return sharpChromatic;
  }

  const modeOffset =
    modeTonicOffsets[
      (supportedModes.includes(mode as ModeName) ? mode : "ionian") as ModeName
    ];
  const relativeMajor = normalizeSemitone(
    (noteToSemitone[tonalCenter] ?? 0) - modeOffset,
  );

  return flatMajorSemitones.has(relativeMajor) ? flatChromatic : sharpChromatic;
}

function normalizeSemitone(value: number) {
  return ((value % 12) + 12) % 12;
}

function getModeIntervals(mode: string) {
  return modeIntervalsByName[
    (supportedModes.includes(mode as ModeName) ? mode : "ionian") as ModeName
  ];
}

function getNoteAtInterval(
  tonalCenter: string,
  semitoneOffset: number,
  chromatic = getPreferredChromatic(tonalCenter),
) {
  const baseSemitone = noteToSemitone[tonalCenter] ?? 0;

  return chromatic[normalizeSemitone(baseSemitone + semitoneOffset)];
}

function getScaleDegreeLabel(rootOffset: number, mode = "ionian") {
  if (rootOffset === 6) {
    // Offset 6 is diatonic only in lydian (#IV) and locrian, where it is the
    // mode's own diminished fifth, not a raised fourth.
    return mode === "locrian" ? "bV" : "#IV";
  }

  return scaleDegreeLabelByOffset[rootOffset] ?? "I";
}

function buildRomanNumeral(
  rootOffset: number,
  quality: SeventhChordQuality,
  mode = "ionian",
) {
  const baseLabel = getScaleDegreeLabel(rootOffset, mode);

  if (quality === "min7" || quality === "min7b5") {
    return `${baseLabel.toLowerCase()}${romanNumeralSuffixMap[quality]}`;
  }

  return `${baseLabel}${romanNumeralSuffixMap[quality]}`;
}

function getSeventhQuality(intervals: readonly number[]): SeventhChordQuality {
  const [third, fifth, seventh] = intervals;

  if (third === 4 && fifth === 7 && seventh === 11) {
    return "maj7";
  }

  if (third === 4 && fifth === 7 && seventh === 10) {
    return "7";
  }

  if (third === 3 && fifth === 7 && seventh === 10) {
    return "min7";
  }

  return "min7b5";
}

function getStackInterval(
  scale: readonly number[],
  degreeIndex: number,
  step: number,
) {
  const nextIndex = degreeIndex + step;
  const wrappedIndex = nextIndex % scale.length;
  const octaveShift = nextIndex >= scale.length ? 12 : 0;

  return scale[wrappedIndex] - scale[degreeIndex] + octaveShift;
}

function buildChordNotes(
  root: string,
  quality: SeventhChordQuality,
  chromatic = getPreferredChromatic(root),
) {
  const qualityIntervals: Readonly<
    Record<SeventhChordQuality, readonly number[]>
  > = {
    maj7: [0, 4, 7, 11],
    "7": [0, 4, 7, 10],
    min7: [0, 3, 7, 10],
    min7b5: [0, 3, 6, 10],
  };

  return qualityIntervals[quality].map((interval) =>
    getNoteAtInterval(root, interval, chromatic),
  );
}

function buildModeSeventhChords(
  tonalCenter: string,
  mode: string,
): readonly BuiltScaleChord[] {
  const chromatic = getPreferredChromatic(tonalCenter, mode);
  const scale = getModeIntervals(mode);

  return scale.map((rootOffset, degreeIndex) => {
    const intervals = [
      getStackInterval(scale, degreeIndex, 2),
      getStackInterval(scale, degreeIndex, 4),
      getStackInterval(scale, degreeIndex, 6),
    ] as const;
    const quality = getSeventhQuality(intervals);
    const root = getNoteAtInterval(tonalCenter, rootOffset, chromatic);

    return {
      root,
      rootOffset,
      quality,
      chordName: `${root}${qualitySuffixMap[quality]}`,
      notes: buildChordNotes(root, quality, chromatic),
      romanNumeral: buildRomanNumeral(rootOffset, quality, mode),
      degreeLabel: getScaleDegreeLabel(rootOffset, mode),
    };
  });
}

function buildSecondaryDominant(
  targetChord: BuiltScaleChord,
  tonalCenter: string,
  chromatic = getPreferredChromatic(tonalCenter),
): ChordCatalogItem {
  const dominantRoot = getNoteAtInterval(targetChord.root, 7, chromatic);
  const quality: SeventhChordQuality = "7";

  return {
    id: `secondary-dominant-${targetChord.degreeLabel.toLowerCase()}`,
    category: "secondaryDominant",
    chordName: `${dominantRoot}${qualitySuffixMap[quality]}`,
    root: dominantRoot,
    quality,
    notes: buildChordNotes(dominantRoot, quality, chromatic),
    parentMode: "secondary dominant",
    badges: [
      `V/${targetChord.degreeLabel}`,
      `targets ${targetChord.chordName}`,
    ],
  };
}

function getChordSignature(chord: Pick<BuiltScaleChord, "root" | "quality">) {
  return `${chord.root}|${chord.quality}`;
}

export function formatModeLabel(mode: string) {
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)}`;
}

export function getChordSourceKind(parentMode: string, masterMode: string) {
  if (parentMode === masterMode) {
    return "diatonic";
  }

  if (parentMode === "secondary dominant") {
    return "secondaryDominant";
  }

  return "modalInterchange";
}

export function formatChordSourceLabel(parentMode: string, masterMode: string) {
  if (parentMode === masterMode) {
    return formatModeLabel(masterMode);
  }

  if (parentMode === "secondary dominant") {
    return "Secondary Dominant";
  }

  return `From ${formatModeLabel(parentMode)}`;
}

export function buildChordCatalog(
  masterTonalCenter: string,
  masterMode: string,
): ChordCatalog {
  const diatonicChords = buildModeSeventhChords(masterTonalCenter, masterMode);
  const masterChromatic = getPreferredChromatic(masterTonalCenter, masterMode);
  const diatonicSignatures = new Set(
    diatonicChords.map((chord) => getChordSignature(chord)),
  );

  const diatonic: readonly ChordCatalogGroup[] = [
    {
      id: "diatonic",
      label: `${masterTonalCenter} ${formatModeLabel(masterMode)}`,
      description: "Current-mode choices for the active sketch.",
      items: diatonicChords.map((chord) => ({
        id: `diatonic-${chord.romanNumeral.toLowerCase()}`,
        category: "diatonic",
        chordName: chord.chordName,
        root: chord.root,
        quality: chord.quality,
        notes: chord.notes,
        parentMode: masterMode,
        badges: [chord.romanNumeral],
      })),
    },
  ];

  const secondaryDominant: readonly ChordCatalogGroup[] = [
    {
      id: "secondary-dominants",
      label: "Secondary Dominants",
      description:
        "Dominant chords that tonicize another degree of the current mode.",
      items: diatonicChords
        .slice(1)
        .map((targetChord) =>
          buildSecondaryDominant(targetChord, masterTonalCenter, masterChromatic),
        ),
    },
  ];

  const modalInterchange = supportedModes
    .filter((mode) => mode !== masterMode)
    .map((mode) => {
      const borrowedChords = buildModeSeventhChords(masterTonalCenter, mode)
        .filter((chord) => !diatonicSignatures.has(getChordSignature(chord)))
        .map((chord) => ({
          id: `${mode}-${chord.romanNumeral.toLowerCase()}`,
          category: "modalInterchange" as const,
          chordName: chord.chordName,
          root: chord.root,
          quality: chord.quality,
          notes: chord.notes,
          parentMode: mode,
          badges: [chord.romanNumeral, `from ${formatModeLabel(mode)}`],
        }));

      return {
        id: `modal-${mode}`,
        label: formatModeLabel(mode),
        description: `Parallel ${formatModeLabel(mode)} colors.`,
        items: borrowedChords,
      };
    })
    .filter((group) => group.items.length > 0);

  return {
    diatonic,
    secondaryDominant,
    modalInterchange,
  };
}
