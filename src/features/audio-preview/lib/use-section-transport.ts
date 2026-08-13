"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChordVoicing } from "@/lib/music/chord-voicing";

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
  // Precomputed by the caller; chords without one fall back to a closed
  // pitch-class stack at octave 3.
  voicing?: ChordVoicing;
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

// One grid beat is one denominator unit (an eighth in 6/8), so a bar spans
// `numerator` grid beats everywhere in the editor and the transport.
function getBeatsPerBar(timeSignature: string) {
  const [numerator] = timeSignature.split("/");
  const beatsPerBar = Number.parseInt(numerator ?? "", 10);

  if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) {
    return 4;
  }

  return beatsPerBar;
}

// tempoBpm counts quarter notes, while the grid counts denominator units, so
// a grid beat advances denominator/4 times as fast as a quarter note. Without
// this scale a 6/8 bar would play six quarter notes long.
function getBeatUnitScale(timeSignature: string) {
  const [, denominator] = timeSignature.split("/");
  const value = Number.parseInt(denominator ?? "", 10);

  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return value / 4;
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

type AudioGraph = Readonly<{
  context: AudioContext;
  chordFilter: BiquadFilterNode;
  masterGain: GainNode;
  compressor: DynamicsCompressorNode;
}>;

type ToneLayer = Readonly<{
  type: OscillatorType;
  freqRatio: number;
  detuneCents: number;
  gainRatio: number;
}>;

type ActiveVoice = Readonly<{
  oscillators: readonly OscillatorNode[];
  gain: GainNode;
}>;

// Chords: fundamental in the user's waveform, a quiet detuned copy for a
// gentle chorus, and an octave sine for harmonic warmth.
function getChordLayers(waveform: PlaybackWaveform): readonly ToneLayer[] {
  return [
    { type: waveform, freqRatio: 1, detuneCents: 0, gainRatio: 1 },
    { type: waveform, freqRatio: 1, detuneCents: 4, gainRatio: 0.35 },
    { type: "sine", freqRatio: 2, detuneCents: 0, gainRatio: 0.18 },
  ];
}

// Melody stays lighter than the chord bed so the line remains articulate.
function getMelodyLayers(waveform: PlaybackWaveform): readonly ToneLayer[] {
  return [
    { type: waveform, freqRatio: 1, detuneCents: 0, gainRatio: 1 },
    { type: "sine", freqRatio: 2, detuneCents: 0, gainRatio: 0.12 },
  ];
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
  const audioGraphRef = useRef<AudioGraph | null>(null);
  const masterLevelRef = useRef(0.75);
  const triggeredEventKeysRef = useRef<Set<string>>(new Set());
  const activeVoicesRef = useRef<Set<ActiveVoice>>(new Set());

  const beatsPerBar = useMemo(
    () => getBeatsPerBar(timeSignature),
    [timeSignature],
  );
  const beatUnitScale = useMemo(
    () => getBeatUnitScale(timeSignature),
    [timeSignature],
  );
  const safeTotalBeats = Math.max(1, totalBeats);
  const barCount = Math.max(1, Math.ceil(safeTotalBeats / beatsPerBar));
  const isCurrentScopeBound = boundScopeKey === scopeKey;
  const playbackStatus = isCurrentScopeBound ? status : "stopped";
  const playbackCurrentBeat = isCurrentScopeBound
    ? clampBeat(currentBeat, safeTotalBeats)
    : 0;

  const silenceAllVoices = useCallback(() => {
    const graph = audioGraphRef.current;

    if (!graph) {
      return;
    }

    const now = graph.context.currentTime;

    activeVoicesRef.current.forEach(({ oscillators, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      } catch {
        // The voice already ended; nothing left to silence.
      }

      oscillators.forEach((oscillator) => {
        try {
          // Legal even for strum-scheduled oscillators that have not started.
          oscillator.stop(now + 0.05);
        } catch {
          // The oscillator already ended.
        }
      });
    });
    activeVoicesRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    setBoundScopeKey(scopeKey);
    setStatus("stopped");
    setCurrentBeat(0);
    currentBeatRef.current = 0;
    triggeredEventKeysRef.current.clear();
    silenceAllVoices();
  }, [scopeKey, silenceAllVoices]);

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
    silenceAllVoices();
  }, [scopeKey, silenceAllVoices]);

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

  const ensureAudioGraph = useCallback((): AudioGraph | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const existing = audioGraphRef.current;

    if (existing && existing.context.state !== "closed") {
      if (existing.context.state === "suspended") {
        void existing.context.resume();
      }

      return existing;
    }

    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    // chords → low-pass → limiter ← melody/metronome; limiter → master gain
    // → speakers. The master gain sits after the limiter so the level slider
    // is true output volume, not compressor drive; the compressor is tuned
    // as a peak-safety limiter that only engages on coincident peaks, so it
    // neither pumps the mix nor adds audible makeup gain.
    const context = new AudioContextCtor();
    const compressor = context.createDynamicsCompressor();

    compressor.threshold.value = -3;
    compressor.knee.value = 6;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    const masterGain = context.createGain();

    masterGain.gain.value = masterLevelRef.current;
    compressor.connect(masterGain);
    masterGain.connect(context.destination);

    const chordFilter = context.createBiquadFilter();

    chordFilter.type = "lowpass";
    chordFilter.frequency.value = 2200;
    chordFilter.Q.value = 0.5;
    chordFilter.connect(compressor);

    const graph: AudioGraph = { context, chordFilter, masterGain, compressor };

    // A rebuild only happens when the browser closed the old context on its
    // own; voices from that context are dead and their onended never fires.
    activeVoicesRef.current.clear();
    audioGraphRef.current = graph;

    if (context.state === "suspended") {
      void context.resume();
    }

    return graph;
  }, []);

  const playVoice = useCallback(
    (
      graph: AudioGraph,
      options: Readonly<{
        frequency: number;
        startTime: number;
        durationSeconds: number;
        peakGain: number;
        destination: AudioNode;
        layers: readonly ToneLayer[];
        pianoDecay: boolean;
      }>,
    ) => {
      const { context } = graph;
      const safeDurationSeconds = Math.max(0.08, options.durationSeconds);
      const peak = Math.max(0.0001, options.peakGain);
      const envelope = context.createGain();

      // Start silent: a GainNode's intrinsic value is 1.0 until its first
      // scheduled event, and strummed voices schedule that event in the
      // future — silenceAllVoices must not find a full-gain envelope there.
      envelope.gain.value = 0.0001;
      envelope.connect(options.destination);

      if (options.pianoDecay) {
        // Soft attack, fast body decay, quieter tail — a rough piano shape
        // from one linear and two exponential segments.
        envelope.gain.setValueAtTime(0.0001, options.startTime);
        envelope.gain.linearRampToValueAtTime(peak, options.startTime + 0.01);
        envelope.gain.exponentialRampToValueAtTime(
          peak * 0.3,
          options.startTime + safeDurationSeconds * 0.5,
        );
        envelope.gain.exponentialRampToValueAtTime(
          0.0001,
          options.startTime + safeDurationSeconds,
        );
      } else {
        envelope.gain.setValueAtTime(0.0001, options.startTime);
        envelope.gain.exponentialRampToValueAtTime(
          peak,
          options.startTime + 0.018,
        );
        envelope.gain.exponentialRampToValueAtTime(
          0.0001,
          options.startTime + safeDurationSeconds,
        );
      }

      const totalGainRatio = options.layers.reduce(
        (sum, layer) => sum + layer.gainRatio,
        0,
      );
      const oscillators = options.layers.map((layer) => {
        const oscillator = context.createOscillator();
        const layerGain = context.createGain();

        oscillator.type = layer.type;
        oscillator.frequency.setValueAtTime(
          options.frequency * layer.freqRatio,
          options.startTime,
        );

        if (layer.detuneCents !== 0) {
          oscillator.detune.setValueAtTime(
            layer.detuneCents,
            options.startTime,
          );
        }

        layerGain.gain.value = layer.gainRatio / totalGainRatio;
        oscillator.connect(layerGain);
        layerGain.connect(envelope);
        oscillator.start(options.startTime);
        oscillator.stop(options.startTime + safeDurationSeconds + 0.03);

        return oscillator;
      });

      const voice: ActiveVoice = { oscillators, gain: envelope };

      activeVoicesRef.current.add(voice);
      oscillators[0].onended = () => {
        activeVoicesRef.current.delete(voice);
      };
    },
    [],
  );

  const playChordFrequencies = useCallback(
    (frequencies: readonly number[], durationSeconds: number) => {
      if (frequencies.length === 0) {
        return;
      }

      const graph = ensureAudioGraph();

      if (!graph) {
        return;
      }

      const layers = getChordLayers(waveform);
      // Equal-power normalization: 1/N over-attenuates dense voicings. The
      // 0.4 constant keeps the chord bed near the pre-voicing loudness.
      const peakGain = 0.4 / Math.sqrt(frequencies.length);
      const sortedFrequencies = [...frequencies].sort((a, b) => a - b);
      // A low-to-high strum: 12 ms per voice is audible warmth, with the
      // total spread capped at 50 ms so dense voicings don't lag the beat.
      const strumStep = Math.min(
        0.012,
        0.05 / Math.max(1, sortedFrequencies.length - 1),
      );
      const chordStartTime = graph.context.currentTime;

      sortedFrequencies.forEach((frequency, index) => {
        playVoice(graph, {
          frequency,
          startTime: chordStartTime + index * strumStep,
          durationSeconds,
          peakGain,
          destination: graph.chordFilter,
          layers,
          pianoDecay: true,
        });
      });
    },
    [ensureAudioGraph, playVoice, waveform],
  );

  const playMelodyFrequency = useCallback(
    (frequency: number, durationSeconds: number) => {
      const graph = ensureAudioGraph();

      if (!graph) {
        return;
      }

      playVoice(graph, {
        frequency,
        startTime: graph.context.currentTime,
        durationSeconds,
        peakGain: 0.52,
        destination: graph.compressor,
        layers: getMelodyLayers(waveform),
        pianoDecay: true,
      });
    },
    [ensureAudioGraph, playVoice, waveform],
  );

  const playMetronomeTick = useCallback(
    (frequency: number) => {
      const graph = ensureAudioGraph();

      if (!graph) {
        return;
      }

      playVoice(graph, {
        frequency,
        startTime: graph.context.currentTime,
        durationSeconds: 0.055,
        peakGain: 0.16,
        destination: graph.compressor,
        layers: [
          { type: waveform, freqRatio: 1, detuneCents: 0, gainRatio: 1 },
        ],
        pianoDecay: false,
      });
    },
    [ensureAudioGraph, playVoice, waveform],
  );

  const triggerPlaybackEvents = useCallback(
    (fromBeat: number, toBeat: number) => {
      const secondsPerBeat = 60 / Math.max(1, tempoBpm) / beatUnitScale;
      const eventKeys = triggeredEventKeysRef.current;

      function isCrossed(startBeat: number) {
        return startBeat >= fromBeat && startBeat < toBeat;
      }

      chords.forEach((chord) => {
        const eventKey = `chord:${sectionId}:${chord.id}:${chord.startBeat}`;

        if (!isCrossed(chord.startBeat) || eventKeys.has(eventKey)) {
          return;
        }

        const midiNotes = chord.voicing?.midiNotes;
        const frequencies =
          midiNotes && midiNotes.length > 0
            ? midiNotes.map(midiToFrequency)
            : chord.notes
                .map((note) => noteNameToFrequency(note, 3))
                .filter((frequency): frequency is number => frequency !== null);

        playChordFrequencies(
          frequencies,
          chord.durationBeats * secondsPerBeat * 0.92,
        );
        eventKeys.add(eventKey);
      });

      melodicNotes.forEach((note) => {
        const eventKey = `melody:${sectionId}:${note.id}:${note.startBeat}`;

        if (!isCrossed(note.startBeat) || eventKeys.has(eventKey)) {
          return;
        }

        playMelodyFrequency(
          midiToFrequency(note.pitch),
          note.durationBeats * secondsPerBeat * 0.88,
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

        playMetronomeTick(beat % beatsPerBar === 0 ? 1046.5 : 784);
        eventKeys.add(eventKey);
      }
    },
    [
      beatUnitScale,
      beatsPerBar,
      chords,
      melodicNotes,
      metronomeEnabled,
      playChordFrequencies,
      playMelodyFrequency,
      playMetronomeTick,
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
      const deltaBeats = (deltaMilliseconds / 60000) * tempoBpm * beatUnitScale;
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
      // Deliberately keep lastFrameTimeRef: this cleanup also runs when a dep
      // changes identity mid-playback, and re-seeding the timestamp there
      // would discard the elapsed time since the last tick — enough of those
      // re-arms and playback audibly drags behind the tempo. The not-playing
      // branch above resets the timestamp when playback actually stops.
    };
  }, [
    beatUnitScale,
    loopEnabled,
    playbackStatus,
    safeTotalBeats,
    tempoBpm,
    triggerPlaybackEvents,
  ]);

  // Switching sections unbinds the scope, which halts the tick loop and
  // reports "stopped" — but voices already sounding would otherwise keep
  // ringing into the newly selected section.
  useEffect(() => {
    if (!isCurrentScopeBound) {
      silenceAllVoices();
    }
  }, [isCurrentScopeBound, silenceAllVoices]);

  // masterLevel lives on the persistent master gain so the slider also
  // affects notes that are already sounding.
  useEffect(() => {
    masterLevelRef.current = clampMasterLevel(masterLevel);
    const graph = audioGraphRef.current;

    if (graph) {
      graph.masterGain.gain.setTargetAtTime(
        masterLevelRef.current,
        graph.context.currentTime,
        0.02,
      );
    }
  }, [masterLevel]);

  useEffect(() => {
    return () => {
      silenceAllVoices();
      const graph = audioGraphRef.current;
      audioGraphRef.current = null;

      if (graph && graph.context.state !== "closed") {
        void graph.context.close();
      }
    };
  }, [silenceAllVoices]);

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
