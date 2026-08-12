"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const playbackWaveforms = [
  "sine",
  "triangle",
  "sawtooth",
  "square",
] as const;

export type PlaybackWaveform = (typeof playbackWaveforms)[number];
export type PlaybackStatus = "stopped" | "playing" | "paused";

export type PlaybackSettings = Readonly<{
  waveform: PlaybackWaveform;
  masterLevel: number;
  loopEnabled: boolean;
  metronomeEnabled: boolean;
}>;

export type TransportState = Readonly<{
  activeSectionId: number;
  status: PlaybackStatus;
  currentBeat: number;
  totalBeats: number;
  beatsPerBar: number;
  barCount: number;
  progress: number;
}> &
  PlaybackSettings;

export type TransportActions = Readonly<{
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (beat: number) => void;
  toggleLoop: () => void;
  toggleMetronome: () => void;
  setWaveform: (waveform: PlaybackWaveform) => void;
  setMasterLevel: (level: number) => void;
}>;

export type PlaybackChord = Readonly<{
  id: number;
  chordName: string;
  notes: readonly string[];
  startBeat: number;
  durationBeats: number;
}>;

export type PlaybackMelodicNote = Readonly<{
  id: number;
  pitch: number;
  startBeat: number;
  durationBeats: number;
}>;

type UseSectionTransportOptions = Readonly<{
  scopeKey: number;
  sectionId: number;
  totalBeats: number;
  tempoBpm: number;
  timeSignature: string;
  chords: readonly PlaybackChord[];
  melodicNotes: readonly PlaybackMelodicNote[];
}>;

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

function getBeatsPerBar(timeSignature: string) {
  const [numerator] = timeSignature.split("/");
  const beatsPerBar = Number.parseInt(numerator ?? "", 10);

  if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) {
    return 4;
  }

  return beatsPerBar;
}

function clampBeat(beat: number, totalBeats: number) {
  if (!Number.isFinite(beat)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.max(0, totalBeats), beat));
}

function clampMasterLevel(level: number) {
  if (!Number.isFinite(level)) {
    return 0.75;
  }

  return Math.max(0, Math.min(1, level));
}

function stripOctave(noteName: string) {
  return noteName.replace(/\d+$/, "");
}

function noteNameToFrequency(noteName: string, octave = 4) {
  const pitchClass = stripOctave(noteName);
  const semitone = noteToSemitone[pitchClass];

  if (semitone === undefined) {
    return null;
  }

  const midi = (octave + 1) * 12 + semitone;

  return 440 * 2 ** ((midi - 69) / 12);
}

function midiToFrequency(pitch: number) {
  return 440 * 2 ** ((pitch - 69) / 12);
}

export function useSectionTransport({
  scopeKey,
  sectionId,
  totalBeats,
  tempoBpm,
  timeSignature,
  chords,
  melodicNotes,
}: UseSectionTransportOptions): Readonly<{
  state: TransportState;
  actions: TransportActions;
}> {
  const [boundScopeKey, setBoundScopeKey] = useState(scopeKey);
  const [status, setStatus] = useState<PlaybackStatus>("stopped");
  const [currentBeat, setCurrentBeat] = useState(0);
  const [waveform, setWaveform] = useState<PlaybackWaveform>("triangle");
  const [masterLevel, setMasterLevel] = useState(0.75);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);

  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const currentBeatRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const triggeredEventKeysRef = useRef<Set<string>>(new Set());

  const beatsPerBar = useMemo(
    () => getBeatsPerBar(timeSignature),
    [timeSignature],
  );
  const safeTotalBeats = Math.max(1, totalBeats);
  const barCount = Math.max(1, Math.ceil(safeTotalBeats / beatsPerBar));
  const isCurrentScopeBound = boundScopeKey === scopeKey;
  const playbackStatus = isCurrentScopeBound ? status : "stopped";
  const playbackCurrentBeat = isCurrentScopeBound
    ? clampBeat(currentBeat, safeTotalBeats)
    : 0;

  const stop = useCallback(() => {
    setBoundScopeKey(scopeKey);
    setStatus("stopped");
    setCurrentBeat(0);
    currentBeatRef.current = 0;
    triggeredEventKeysRef.current.clear();
  }, [scopeKey]);

  const play = useCallback(() => {
    const baseCurrentBeat = isCurrentScopeBound
      ? clampBeat(currentBeatRef.current, safeTotalBeats)
      : 0;
    const nextBeat = baseCurrentBeat >= safeTotalBeats ? 0 : baseCurrentBeat;

    currentBeatRef.current = nextBeat;
    triggeredEventKeysRef.current.clear();
    setCurrentBeat(nextBeat);
    setBoundScopeKey(scopeKey);
    setStatus("playing");
  }, [isCurrentScopeBound, safeTotalBeats, scopeKey]);

  const pause = useCallback(() => {
    setBoundScopeKey(scopeKey);
    setStatus("paused");
  }, [scopeKey]);

  const seek = useCallback(
    (beat: number) => {
      if (!isCurrentScopeBound) {
        // The UI shows an unbound scope as stopped; rebinding through a
        // playhead drag must not resurrect the previous section's "playing"
        // status and start audio the user never asked for.
        setStatus("stopped");
      }

      setBoundScopeKey(scopeKey);
      const nextBeat = clampBeat(beat, safeTotalBeats);

      currentBeatRef.current = nextBeat;
      triggeredEventKeysRef.current.clear();
      setCurrentBeat(nextBeat);
    },
    [isCurrentScopeBound, safeTotalBeats, scopeKey],
  );

  const toggleLoop = useCallback(() => {
    setLoopEnabled((current) => !current);
  }, []);

  const toggleMetronome = useCallback(() => {
    setMetronomeEnabled((current) => !current);
  }, []);

  const updateWaveform = useCallback((nextWaveform: PlaybackWaveform) => {
    setWaveform(nextWaveform);
  }, []);

  const updateMasterLevel = useCallback((nextLevel: number) => {
    setMasterLevel(clampMasterLevel(nextLevel));
  }, []);

  const playToneFrequencies = useCallback(
    (
      frequencies: readonly number[],
      durationSeconds: number,
      gainMultiplier = 1,
    ) => {
      if (frequencies.length === 0 || typeof window === "undefined") {
        return;
      }

      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextCtor) {
        return;
      }

      const audioContext = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      const startTime = audioContext.currentTime;
      const safeDurationSeconds = Math.max(0.08, durationSeconds);

      frequencies.forEach((frequency) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, (masterLevel * gainMultiplier) / frequencies.length),
          startTime + 0.018,
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + safeDurationSeconds,
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + safeDurationSeconds + 0.03);
      });
    },
    [masterLevel, waveform],
  );

  const triggerPlaybackEvents = useCallback(
    (fromBeat: number, toBeat: number) => {
      const secondsPerBeat = 60 / Math.max(1, tempoBpm);
      const eventKeys = triggeredEventKeysRef.current;

      function isCrossed(startBeat: number) {
        return startBeat >= fromBeat && startBeat < toBeat;
      }

      chords.forEach((chord) => {
        const eventKey = `chord:${sectionId}:${chord.id}:${chord.startBeat}`;

        if (!isCrossed(chord.startBeat) || eventKeys.has(eventKey)) {
          return;
        }

        const frequencies = chord.notes
          .map((note) => noteNameToFrequency(note, 3))
          .filter((frequency): frequency is number => frequency !== null);

        playToneFrequencies(
          frequencies,
          chord.durationBeats * secondsPerBeat * 0.92,
          0.72,
        );
        eventKeys.add(eventKey);
      });

      melodicNotes.forEach((note) => {
        const eventKey = `melody:${sectionId}:${note.id}:${note.startBeat}`;

        if (!isCrossed(note.startBeat) || eventKeys.has(eventKey)) {
          return;
        }

        playToneFrequencies(
          [midiToFrequency(note.pitch)],
          note.durationBeats * secondsPerBeat * 0.88,
          0.52,
        );
        eventKeys.add(eventKey);
      });

      if (!metronomeEnabled) {
        return;
      }

      // Half-open [fromBeat, toBeat), matching isCrossed: beat 0 clicks when
      // playback starts from the top, and the section-end boundary is left to
      // the next window (the loop wrap re-enters at beat 0).
      const firstBeat = Math.ceil(fromBeat);
      const lastBeat = Math.ceil(toBeat) - 1;

      for (let beat = firstBeat; beat <= lastBeat; beat += 1) {
        const eventKey = `metronome:${sectionId}:${beat}`;

        if (eventKeys.has(eventKey)) {
          continue;
        }

        playToneFrequencies(
          [beat % beatsPerBar === 0 ? 1046.5 : 784],
          0.055,
          0.16,
        );
        eventKeys.add(eventKey);
      }
    },
    [
      beatsPerBar,
      chords,
      melodicNotes,
      metronomeEnabled,
      playToneFrequencies,
      sectionId,
      tempoBpm,
    ],
  );

  useEffect(() => {
    if (playbackStatus !== "playing") {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastFrameTimeRef.current = null;

      return;
    }

    // The tick works entirely on refs and calls setState with plain values:
    // audio scheduling inside a state updater would run twice under
    // StrictMode and is unsafe under the React Compiler.
    function tick(timestamp: number) {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaMilliseconds = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      const deltaBeats = (deltaMilliseconds / 60000) * tempoBpm;
      const baseCurrentBeat = clampBeat(currentBeatRef.current, safeTotalBeats);
      const nextBeat = baseCurrentBeat + deltaBeats;

      if (nextBeat < safeTotalBeats) {
        triggerPlaybackEvents(baseCurrentBeat, nextBeat);
        currentBeatRef.current = nextBeat;
        setCurrentBeat(nextBeat);
        animationFrameIdRef.current = window.requestAnimationFrame(tick);

        return;
      }

      if (loopEnabled) {
        triggerPlaybackEvents(baseCurrentBeat, safeTotalBeats);
        triggeredEventKeysRef.current.clear();
        const wrappedBeat = nextBeat % safeTotalBeats;

        triggerPlaybackEvents(0, wrappedBeat);
        currentBeatRef.current = wrappedBeat;
        setCurrentBeat(wrappedBeat);
        animationFrameIdRef.current = window.requestAnimationFrame(tick);

        return;
      }

      triggerPlaybackEvents(baseCurrentBeat, safeTotalBeats);
      currentBeatRef.current = safeTotalBeats;
      setCurrentBeat(safeTotalBeats);
      setStatus("stopped");
      lastFrameTimeRef.current = null;
      animationFrameIdRef.current = null;
    }

    animationFrameIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
  }, [
    loopEnabled,
    playbackStatus,
    safeTotalBeats,
    tempoBpm,
    triggerPlaybackEvents,
  ]);

  const state = useMemo<TransportState>(
    () => ({
      activeSectionId: sectionId,
      status: playbackStatus,
      currentBeat: playbackCurrentBeat,
      totalBeats: safeTotalBeats,
      beatsPerBar,
      barCount,
      progress: safeTotalBeats > 0 ? playbackCurrentBeat / safeTotalBeats : 0,
      waveform,
      masterLevel,
      loopEnabled,
      metronomeEnabled,
    }),
    [
      barCount,
      beatsPerBar,
      loopEnabled,
      masterLevel,
      metronomeEnabled,
      playbackCurrentBeat,
      playbackStatus,
      safeTotalBeats,
      sectionId,
      waveform,
    ],
  );

  const actions = useMemo<TransportActions>(
    () => ({
      play,
      pause,
      stop,
      seek,
      toggleLoop,
      toggleMetronome,
      setWaveform: updateWaveform,
      setMasterLevel: updateMasterLevel,
    }),
    [
      pause,
      play,
      seek,
      stop,
      toggleLoop,
      toggleMetronome,
      updateMasterLevel,
      updateWaveform,
    ],
  );

  return {
    state,
    actions,
  };
}
