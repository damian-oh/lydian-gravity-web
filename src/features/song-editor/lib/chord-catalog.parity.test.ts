import { describe, expect, it } from "vitest";

import {
  buildModeSeventhChords,
  buildSecondaryDominant,
  getPreferredChromatic,
} from "./chord-catalog";

// Golden fixture generated from the backend's music_theory.py, which must stay
// in behavioral lockstep with chord-catalog.ts. The backend asserts the same
// file in tests/test_music_theory.py; regenerate it there if the shared
// algorithm intentionally changes.
import parityFixture from "../../../../../lydian-gravity-fastapi/tests/fixtures/theory_parity.json";

type FixtureChord = Readonly<{
  chord_name: string;
  root: string;
  quality: string;
  notes: readonly string[];
  roman_numeral: string;
  degree_label: string;
}>;

type FixtureSecondaryDominant = Readonly<{
  chord_name: string;
  root: string;
  notes: readonly string[];
  target_degree_label: string;
}>;

type FixtureEntry = Readonly<{
  pitch_collection: readonly string[];
  diatonic: readonly FixtureChord[];
  secondary_dominants: readonly FixtureSecondaryDominant[];
}>;

const entries = Object.entries(parityFixture as Record<string, FixtureEntry>);

describe("chord catalog parity with the backend", () => {
  it("covers the full tonic/mode grid", () => {
    expect(entries).toHaveLength(63);
  });

  it.each(entries)("matches the backend for %s", (key, expected) => {
    const [tonalCenter, mode] = key.split("|");
    const diatonic = buildModeSeventhChords(tonalCenter, mode);

    expect(diatonic.map((chord) => chord.root)).toEqual(
      expected.pitch_collection,
    );
    expect(
      diatonic.map((chord) => ({
        chord_name: chord.chordName,
        root: chord.root,
        quality: chord.quality,
        notes: [...chord.notes],
        roman_numeral: chord.romanNumeral,
        degree_label: chord.degreeLabel,
      })),
    ).toEqual(expected.diatonic);

    const chromatic = getPreferredChromatic(tonalCenter, mode);
    const secondaryDominants = diatonic.slice(1).map((targetChord) => {
      const item = buildSecondaryDominant(targetChord, tonalCenter, chromatic);

      return {
        chord_name: item.chordName,
        root: item.root,
        notes: [...item.notes],
        target_degree_label: targetChord.degreeLabel,
      };
    });

    expect(secondaryDominants).toEqual(expected.secondary_dominants);
  });
});
