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

type UseSectionTransportOptions = Readonly<{
  scopeKey: number;
  sectionId: number;
  totalBeats: number;
  tempoBpm: number;
  timeSignature: string;
}>;

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

export function useSectionTransport({
  scopeKey,
  sectionId,
  totalBeats,
  tempoBpm,
  timeSignature,
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
  }, [scopeKey]);

  const play = useCallback(() => {
    setBoundScopeKey(scopeKey);
    setCurrentBeat((current) => {
      const baseCurrentBeat = isCurrentScopeBound
        ? clampBeat(current, safeTotalBeats)
        : 0;

      return baseCurrentBeat >= safeTotalBeats ? 0 : baseCurrentBeat;
    });
    setStatus("playing");
  }, [isCurrentScopeBound, safeTotalBeats, scopeKey]);

  const pause = useCallback(() => {
    setBoundScopeKey(scopeKey);
    setStatus("paused");
  }, [scopeKey]);

  const seek = useCallback(
    (beat: number) => {
      setBoundScopeKey(scopeKey);
      setCurrentBeat(clampBeat(beat, safeTotalBeats));
    },
    [safeTotalBeats, scopeKey],
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

  useEffect(() => {
    if (playbackStatus !== "playing") {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastFrameTimeRef.current = null;

      return;
    }

    function tick(timestamp: number) {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaMilliseconds = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      const deltaBeats = (deltaMilliseconds / 60000) * tempoBpm;
      let reachedSectionEnd = false;

      setCurrentBeat((current) => {
        const baseCurrentBeat = isCurrentScopeBound
          ? clampBeat(current, safeTotalBeats)
          : 0;
        const nextBeat = baseCurrentBeat + deltaBeats;

        if (nextBeat < safeTotalBeats) {
          return nextBeat;
        }

        if (loopEnabled) {
          return safeTotalBeats === 0 ? 0 : nextBeat % safeTotalBeats;
        }

        reachedSectionEnd = true;

        return safeTotalBeats;
      });

      if (reachedSectionEnd) {
        setStatus("stopped");
        lastFrameTimeRef.current = null;
        animationFrameIdRef.current = null;

        return;
      }

      animationFrameIdRef.current = window.requestAnimationFrame(tick);
    }

    animationFrameIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastFrameTimeRef.current = null;
    };
  }, [isCurrentScopeBound, loopEnabled, playbackStatus, safeTotalBeats, tempoBpm]);

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
    [pause, play, seek, stop, toggleLoop, toggleMetronome, updateMasterLevel, updateWaveform],
  );

  return {
    state,
    actions,
  };
}
