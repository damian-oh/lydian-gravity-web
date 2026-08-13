// Voice-led chord voicings for the audio preview. Chords arrive as ordered
// pitch-class name arrays (notes[0] is the root, notes[1..3] the 3rd/5th/7th,
// notes[4+] extensions — the construction order in chord-catalog.ts), and this
// module turns them into concrete MIDI notes: a bass root around octave 2,
// upper voices that move minimally from the previous chord, and extensions
// placed above the upper voices as color tones.

export type ChordVoicing = Readonly<{
  /** Root in MIDI 36-47 (C2-B2); null if no note was parseable. */
  bassMidi: number | null;
  /** Core voices (3rd/5th/7th), ascending, within UPPER_RANGE. */
  upperMidi: readonly number[];
  /** Extension color tones, ascending, strictly above the upper voices. */
  colorMidi: readonly number[];
  /** bass + upper + color, ascending, deduped — what playback renders. */
  midiNotes: readonly number[];
}>;

export const BASS_RANGE = { min: 36, max: 47 } as const;
export const UPPER_RANGE = { min: 52, max: 72, center: 62 } as const;
export const COLOR_MAX = 84;

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

const emptyVoicing: ChordVoicing = {
  bassMidi: null,
  upperMidi: [],
  colorMidi: [],
  midiNotes: [],
};

type ParsedChord = Readonly<{
  rootSemitone: number | null;
  coreSemitones: readonly number[];
  extensionSemitones: readonly number[];
}>;

function parseChord(notes: readonly string[]): ParsedChord {
  const semitones = notes
    .map((note) => noteToSemitone[note.replace(/\d+$/, "")])
    .filter((semitone): semitone is number => semitone !== undefined);

  if (semitones.length === 0) {
    return { rootSemitone: null, coreSemitones: [], extensionSemitones: [] };
  }

  const rootSemitone = semitones[0];
  const coreSemitones = [
    ...new Set(
      semitones.slice(1, 4).filter((semitone) => semitone !== rootSemitone),
    ),
  ];
  const coreSet = new Set(coreSemitones);
  const extensionSemitones = [
    ...new Set(
      semitones
        .slice(4)
        .filter(
          (semitone) => semitone !== rootSemitone && !coreSet.has(semitone),
        ),
    ),
  ];

  // Dyads and single notes: double the root upstairs so the chord still
  // sounds as more than a lone bass note plus one voice. The duplicate
  // entries land in different octaves via the unison rejection in
  // chooseUpperVoices.
  while (coreSemitones.length < 2) {
    coreSemitones.push(rootSemitone);
  }

  return { rootSemitone, coreSemitones, extensionSemitones };
}

function upperCandidates(semitone: number) {
  return [48 + semitone, 60 + semitone, 72 + semitone].filter(
    (midi) => midi >= UPPER_RANGE.min && midi <= UPPER_RANGE.max,
  );
}

// Gaps under 3 semitones between adjacent upper voices sound like clusters.
function crowdPenalty(sorted: readonly number[]) {
  let penalty = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] - sorted[index - 1] < 3) {
      penalty += 6;
    }
  }

  return penalty;
}

function firstChordCost(sorted: readonly number[]) {
  const centering = sorted.reduce(
    (sum, midi) => sum + Math.abs(midi - UPPER_RANGE.center),
    0,
  );
  const span =
    sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0;
  const spreadPenalty = span > 12 ? (span - 12) * 2 : 0;

  return centering + crowdPenalty(sorted) + spreadPenalty;
}

// Index-wise pairing of two ascending arrays is the optimal non-crossing
// assignment, so no general matching algorithm is needed.
function voiceLeadingCost(
  sorted: readonly number[],
  previous: readonly number[],
) {
  const pairCount = Math.min(sorted.length, previous.length);
  let movement = 0;

  for (let index = 0; index < pairCount; index += 1) {
    movement += Math.abs(sorted[index] - previous[index]);
  }

  movement += 4 * Math.abs(sorted.length - previous.length);

  const drift =
    0.3 *
    sorted.reduce((sum, midi) => sum + Math.abs(midi - UPPER_RANGE.center), 0);

  return movement + drift + crowdPenalty(sorted);
}

function compareCandidates(
  a: readonly number[],
  b: readonly number[],
) {
  const sumA = a.reduce((sum, midi) => sum + midi, 0);
  const sumB = b.reduce((sum, midi) => sum + midi, 0);

  if (sumA !== sumB) {
    return sumA - sumB;
  }

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }

  return a.length - b.length;
}

function chooseUpperVoices(
  coreSemitones: readonly number[],
  previousUpperMidi: readonly number[] | null,
): readonly number[] {
  let combos: number[][] = [[]];

  coreSemitones.forEach((semitone) => {
    const candidates = upperCandidates(semitone);

    combos = combos.flatMap((combo) =>
      candidates.map((midi) => [...combo, midi]),
    );
  });

  let best: readonly number[] | null = null;
  let bestCost = Number.POSITIVE_INFINITY;

  combos.forEach((combo) => {
    const sorted = [...combo].sort((a, b) => a - b);

    // Unisons only arise when the root is doubled into the core; treating
    // voices as an ordered low-to-high set also rules out voice crossing.
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index] === sorted[index - 1]) {
        return;
      }
    }

    const cost =
      previousUpperMidi === null || previousUpperMidi.length === 0
        ? firstChordCost(sorted)
        : voiceLeadingCost(sorted, previousUpperMidi);

    if (
      cost < bestCost ||
      (cost === bestCost && best !== null && compareCandidates(sorted, best) < 0)
    ) {
      best = sorted;
      bestCost = cost;
    }
  });

  return best ?? [];
}

function placeColorTones(
  extensionSemitones: readonly number[],
  upperMidi: readonly number[],
): readonly number[] {
  const colorMidi: number[] = [];
  let floor =
    (upperMidi.length > 0 ? upperMidi[upperMidi.length - 1] : UPPER_RANGE.center) +
    1;

  extensionSemitones.forEach((semitone) => {
    let midi = floor + ((semitone - floor) % 12 + 12) % 12;

    if (midi > COLOR_MAX) {
      // Out of ceiling: wrap into the top octave window (COLOR_MAX-11 ..
      // COLOR_MAX], which holds exactly one slot per pitch class. A wrapped
      // tone can land below an earlier color tone — unavoidable given the
      // ceiling — but always stays above the upper voices and never collides
      // (distinct pitch classes map to distinct slots).
      midi = COLOR_MAX - ((COLOR_MAX - semitone) % 12);
    }

    colorMidi.push(midi);
    floor = midi + 1;
  });

  return [...new Set(colorMidi)].sort((a, b) => a - b);
}

/**
 * Voice one chord. `previousUpperMidi` is the previous chord's upper voices
 * (null for the first chord); the chosen upper voices minimize movement from
 * them while drifting back toward the range center.
 */
export function voiceChord(
  notes: readonly string[],
  previousUpperMidi: readonly number[] | null,
): ChordVoicing {
  const { rootSemitone, coreSemitones, extensionSemitones } =
    parseChord(notes);

  if (rootSemitone === null) {
    return emptyVoicing;
  }

  const bassMidi = BASS_RANGE.min + rootSemitone;
  const upperMidi = chooseUpperVoices(coreSemitones, previousUpperMidi);
  const colorMidi = placeColorTones(extensionSemitones, upperMidi);
  const midiNotes = [...new Set([bassMidi, ...upperMidi, ...colorMidi])].sort(
    (a, b) => a - b,
  );

  return { bassMidi, upperMidi, colorMidi, midiNotes };
}

/**
 * Voice an ordered progression; result[i] corresponds to chordNotes[i]. Each
 * chord is voice-led from the last chord that produced upper voices, so an
 * unparseable chord does not reset its neighbors' voice leading.
 */
export function voiceProgression(
  chordNotes: readonly (readonly string[])[],
): readonly ChordVoicing[] {
  let previousUpperMidi: readonly number[] | null = null;

  return chordNotes.map((notes) => {
    const voicing = voiceChord(notes, previousUpperMidi);

    if (voicing.upperMidi.length > 0) {
      previousUpperMidi = voicing.upperMidi;
    }

    return voicing;
  });
}
