import { describe, expect, it } from "vitest";

import {
  BASS_RANGE,
  COLOR_MAX,
  UPPER_RANGE,
  voiceChord,
  voiceProgression,
} from "./chord-voicing";

// I-vi-ii-V in C major, as chord-catalog.ts emits it: root first, then
// 3rd/5th/7th.
const twoFiveOne = [
  ["C", "E", "G", "B"],
  ["A", "C", "E", "G"],
  ["D", "F", "A", "C"],
  ["G", "B", "D", "F"],
] as const;

function movement(a: readonly number[], b: readonly number[]) {
  const pairCount = Math.min(a.length, b.length);
  let total = 0;

  for (let index = 0; index < pairCount; index += 1) {
    total += Math.abs(a[index] - b[index]);
  }

  return total;
}

describe("voiceChord", () => {
  it("puts the root in the bass octave", () => {
    const cases: readonly (readonly [readonly string[], number])[] = [
      [["C", "E", "G", "B"], 0],
      [["F#", "A#", "C#", "E"], 6],
      [["Bb", "Db", "F", "Ab"], 10],
    ];

    cases.forEach(([notes, rootSemitone]) => {
      const voicing = voiceChord(notes, null);

      expect(voicing.bassMidi).not.toBeNull();
      expect(voicing.bassMidi! % 12).toBe(rootSemitone);
      expect(voicing.bassMidi!).toBeGreaterThanOrEqual(BASS_RANGE.min);
      expect(voicing.bassMidi!).toBeLessThanOrEqual(BASS_RANGE.max);
    });
  });

  it("keeps upper voices in range, ascending, above the bass", () => {
    twoFiveOne.forEach((notes) => {
      const voicing = voiceChord(notes, null);

      expect(voicing.upperMidi.length).toBeGreaterThanOrEqual(2);
      voicing.upperMidi.forEach((midi) => {
        expect(midi).toBeGreaterThanOrEqual(UPPER_RANGE.min);
        expect(midi).toBeLessThanOrEqual(UPPER_RANGE.max);
      });

      for (let index = 1; index < voicing.upperMidi.length; index += 1) {
        expect(voicing.upperMidi[index]).toBeGreaterThan(
          voicing.upperMidi[index - 1],
        );
      }

      expect(voicing.bassMidi!).toBeLessThan(voicing.upperMidi[0]);

      const sortedNotes = [...voicing.midiNotes];

      expect(sortedNotes).toEqual(
        [...new Set(voicing.midiNotes)].sort((a, b) => a - b),
      );
    });
  });

  it("is deterministic for the same inputs", () => {
    const previous = [60, 64, 67] as const;

    expect(voiceChord(twoFiveOne[1], previous)).toEqual(
      voiceChord(twoFiveOne[1], previous),
    );
  });

  it("places extensions above the upper voices as color tones", () => {
    const voicing = voiceChord(["C", "E", "G", "B", "F#"], null);

    expect(voicing.colorMidi).toHaveLength(1);
    expect(voicing.colorMidi[0] % 12).toBe(6);
    expect(voicing.colorMidi[0]).toBeGreaterThan(
      voicing.upperMidi[voicing.upperMidi.length - 1],
    );
    expect(voicing.colorMidi[0]).toBeLessThanOrEqual(COLOR_MAX);
  });

  it("stacks multiple extensions ascending without collisions", () => {
    const voicing = voiceChord(["C", "E", "G", "B", "D", "F#"], null);

    expect(voicing.colorMidi).toHaveLength(2);
    expect(voicing.colorMidi[0]).toBeLessThan(voicing.colorMidi[1]);
    expect(voicing.colorMidi[0]).toBeGreaterThan(
      voicing.upperMidi[voicing.upperMidi.length - 1],
    );
    expect(voicing.colorMidi[1]).toBeLessThanOrEqual(COLOR_MAX);
  });

  it("wraps ceiling-bound extensions into the top octave window", () => {
    // E13(9) voiced after a high previous chord pushes the second extension
    // past COLOR_MAX, forcing the wrap branch.
    const voicing = voiceChord(
      ["E", "G#", "B", "D", "F#", "C#"],
      [59, 64, 67],
    );
    const maxUpper = voicing.upperMidi[voicing.upperMidi.length - 1];

    expect(voicing.colorMidi).toHaveLength(2);
    expect(new Set(voicing.colorMidi).size).toBe(2);
    voicing.colorMidi.forEach((midi) => {
      expect(midi).toBeGreaterThan(maxUpper);
      expect(midi).toBeLessThanOrEqual(COLOR_MAX);
    });
  });

  it("keeps midiNotes equal to bass plus upper plus color", () => {
    const voicing = voiceChord(["C", "E", "G", "B", "F#"], null);

    expect(voicing.midiNotes).toEqual(
      [voicing.bassMidi!, ...voicing.upperMidi, ...voicing.colorMidi].sort(
        (a, b) => a - b,
      ),
    );
  });

  it("handles degenerate inputs gracefully", () => {
    expect(voiceChord([], null)).toEqual({
      bassMidi: null,
      upperMidi: [],
      colorMidi: [],
      midiNotes: [],
    });

    const single = voiceChord(["C"], null);

    expect(single.bassMidi).toBe(36);
    // The doubled root must land in two octaves, not collapse to one voice.
    expect(single.upperMidi.length).toBeGreaterThanOrEqual(2);

    const dyad = voiceChord(["C", "E"], null);

    expect(dyad.midiNotes.length).toBeGreaterThanOrEqual(3);

    const unknown = voiceChord(["X?", "E", "G", "B"], null);

    expect(unknown.bassMidi).not.toBeNull();
    expect(unknown.midiNotes.length).toBeGreaterThan(0);
  });
});

describe("voiceProgression", () => {
  it("produces the expected voicings for I-vi-ii-V in C", () => {
    const voicings = voiceProgression(twoFiveOne);

    expect(voicings.map((voicing) => voicing.bassMidi)).toEqual([
      36, 45, 38, 43,
    ]);
    expect(voicings.map((voicing) => voicing.upperMidi)).toEqual([
      [59, 64, 67],
      [60, 64, 67],
      [60, 65, 69],
      [62, 65, 71],
    ]);
  });

  it("keeps voice-led voicings inside the range invariants", () => {
    voiceProgression(twoFiveOne).forEach((voicing) => {
      voicing.upperMidi.forEach((midi) => {
        expect(midi).toBeGreaterThanOrEqual(UPPER_RANGE.min);
        expect(midi).toBeLessThanOrEqual(UPPER_RANGE.max);
      });

      for (let index = 1; index < voicing.upperMidi.length; index += 1) {
        expect(voicing.upperMidi[index]).toBeGreaterThan(
          voicing.upperMidi[index - 1],
        );
      }

      expect(voicing.bassMidi!).toBeLessThan(voicing.upperMidi[0]);
    });
  });

  it("moves upper voices minimally between adjacent chords", () => {
    const voicings = voiceProgression(twoFiveOne);

    for (let index = 1; index < voicings.length; index += 1) {
      const led = movement(
        voicings[index - 1].upperMidi,
        voicings[index].upperMidi,
      );
      const fromScratch = movement(
        voicings[index - 1].upperMidi,
        voiceChord(twoFiveOne[index], null).upperMidi,
      );

      // These four chords share common tones, so nearest-neighbor voicing
      // should move each transition by only a step or two per voice.
      expect(led).toBeLessThanOrEqual(6);
      expect(led).toBeLessThanOrEqual(fromScratch);
    }
  });

  it("keeps voice leading intact across an unparseable chord", () => {
    const withGap = [
      twoFiveOne[0],
      [] as readonly string[],
      twoFiveOne[1],
    ] as const;
    const voicings = voiceProgression(withGap);
    const direct = voiceProgression([twoFiveOne[0], twoFiveOne[1]]);

    expect(voicings[1].midiNotes).toEqual([]);
    expect(voicings[2]).toEqual(direct[1]);
  });
});
