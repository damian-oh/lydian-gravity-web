import { apiFetch } from "@/lib/api/api-client";

import {
  emptySectionTheory,
  type ChordSuggestion,
  type MelodicNoteModel,
  type SectionTheoryModel,
  type SectionType,
  type SongChord,
  type SongSectionModel,
  type SongSketchModel,
  type SongSummaryModel,
} from "./song-model";

type ApiSongSummary = Readonly<{
  id: number;
  user_id: number;
  title: string;
  master_tonal_center: string;
  master_mode: string;
  tempo_bpm: number;
  time_signature: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  section_count?: number;
}>;

type ApiChord = Readonly<{
  id: number;
  section_id: number;
  order_index: number;
  root: string;
  quality: string;
  chord_name: string;
  notes: readonly string[];
  start_beat: number;
  duration_beats: number;
  parent_mode: string;
}>;

type ApiMelodicNote = Readonly<{
  id: number;
  section_id: number;
  pitch: number;
  start_beat: number;
  duration_beats: number;
}>;

type ApiSection = Readonly<{
  id: number;
  song_sketch_id: number;
  section_type: SectionType;
  label: string | null;
  order_index: number;
  total_beats: number;
  chords: readonly ApiChord[];
  melodic_notes: readonly ApiMelodicNote[];
}>;

type ApiSong = ApiSongSummary &
  Readonly<{
    sections: readonly ApiSection[];
  }>;

type ApiChordSuggestion = Readonly<{
  id: string;
  chord_name: string;
  root: string;
  quality: string;
  notes: readonly string[];
  parent_mode: string;
  reason: string;
  tension: "grounded" | "lift" | "borrowed" | "release";
}>;

type ApiNextStepResponse = Readonly<{
  pitch_collection: readonly string[];
  gravity_center: readonly string[];
  suggested_chords: readonly ApiChordSuggestion[];
  melody_prompt: string;
  rhythmic_prompt: string;
  interchange_insight?: string | null;
}>;

export type SongCreatePayload = Readonly<{
  title: string;
  masterTonalCenter: string;
  masterMode: string;
  tempoBpm: number;
  timeSignature: string;
  notes: string;
}>;

function mapChord(chord: ApiChord): SongChord {
  return {
    id: chord.id,
    sectionId: chord.section_id,
    orderIndex: chord.order_index,
    root: chord.root,
    quality: chord.quality,
    chordName: chord.chord_name,
    notes: chord.notes,
    startBeat: chord.start_beat,
    durationBeats: chord.duration_beats,
    parentMode: chord.parent_mode,
  };
}

function mapMelodicNote(note: ApiMelodicNote): MelodicNoteModel {
  return {
    id: note.id,
    sectionId: note.section_id,
    pitch: note.pitch,
    startBeat: note.start_beat,
    durationBeats: note.duration_beats,
  };
}

function mapSection(section: ApiSection): SongSectionModel {
  return {
    id: section.id,
    songSketchId: section.song_sketch_id,
    sectionType: section.section_type,
    label: section.label ?? section.section_type,
    orderIndex: section.order_index,
    totalBeats: section.total_beats,
    chords: section.chords.map(mapChord),
    melodicNotes: section.melodic_notes.map(mapMelodicNote),
    theory: emptySectionTheory,
  };
}

function mapSummary(song: ApiSongSummary): SongSummaryModel {
  return {
    id: String(song.id),
    title: song.title,
    masterTonalCenter: song.master_tonal_center,
    masterMode: song.master_mode,
    tempoBpm: song.tempo_bpm,
    timeSignature: song.time_signature,
    notes: song.notes ?? "",
    createdAt: song.created_at,
    updatedAt: song.updated_at ?? song.created_at,
    sectionCount: song.section_count ?? 0,
  };
}

function mapSong(song: ApiSong): SongSketchModel {
  return {
    id: String(song.id),
    title: song.title,
    masterTonalCenter: song.master_tonal_center,
    masterMode: song.master_mode,
    tempoBpm: song.tempo_bpm,
    timeSignature: song.time_signature,
    notes: song.notes ?? "",
    createdAt: song.created_at,
    updatedAt: song.updated_at ?? song.created_at,
    userId: song.user_id,
    sections: song.sections.map(mapSection),
  };
}

function mapSuggestion(suggestion: ApiChordSuggestion): ChordSuggestion {
  return {
    id: suggestion.id,
    chordName: suggestion.chord_name,
    root: suggestion.root,
    quality: suggestion.quality,
    notes: suggestion.notes,
    parentMode: suggestion.parent_mode,
    reason: suggestion.reason,
    tension: suggestion.tension,
  };
}

export function mapNextStepResponse(
  response: ApiNextStepResponse,
): SectionTheoryModel {
  return {
    pitchCollection: response.pitch_collection,
    gravityCenter: response.gravity_center,
    suggestedChords: response.suggested_chords.map(mapSuggestion),
    melodyPrompt: response.melody_prompt,
    rhythmicPrompt: response.rhythmic_prompt,
    interchangeInsight: response.interchange_insight ?? undefined,
  };
}

export async function listSongs(token: string) {
  const response = await apiFetch<ApiSongSummary[]>("/songs", {
    method: "GET",
    token,
  });

  return response.map(mapSummary);
}

export async function createSong(token: string, payload: SongCreatePayload) {
  const response = await apiFetch<ApiSong>("/songs", {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: payload.title,
      master_tonal_center: payload.masterTonalCenter,
      master_mode: payload.masterMode,
      tempo_bpm: payload.tempoBpm,
      time_signature: payload.timeSignature,
      notes: payload.notes,
    }),
  });

  return mapSong(response);
}

export async function getSong(token: string, songId: string) {
  const response = await apiFetch<ApiSong>(`/songs/${songId}`, {
    method: "GET",
    token,
  });

  return mapSong(response);
}

export async function saveSongArrangement(
  token: string,
  songId: string,
  sections: readonly SongSectionModel[],
) {
  const response = await apiFetch<ApiSong>(`/songs/${songId}/arrangement`, {
    method: "PUT",
    token,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sections: sections.map((section) => ({
        id: section.id,
        section_type: section.sectionType,
        label: section.label,
        order_index: section.orderIndex,
        total_beats: section.totalBeats,
        chords: section.chords.map((chord) => ({
          id: chord.id,
          order_index: chord.orderIndex,
          root: chord.root,
          quality: chord.quality,
          chord_name: chord.chordName,
          notes: chord.notes,
          start_beat: chord.startBeat,
          duration_beats: chord.durationBeats,
          parent_mode: chord.parentMode,
        })),
        melodic_notes: section.melodicNotes.map((note) => ({
          id: note.id,
          pitch: note.pitch,
          start_beat: note.startBeat,
          duration_beats: note.durationBeats,
        })),
      })),
    }),
  });

  return mapSong(response);
}

export async function requestNextSteps(
  token: string,
  song: SongSketchModel,
  section: SongSectionModel,
  selectedChordId: number | null,
  selectedNoteId: number | null,
  signal?: AbortSignal,
) {
  const response = await apiFetch<ApiNextStepResponse>(
    "/suggestions/next-steps",
    {
      method: "POST",
      token,
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        master_tonal_center: song.masterTonalCenter,
        master_mode: song.masterMode,
        selected_chord_id: selectedChordId,
        selected_note_id: selectedNoteId,
        active_section: {
          section_type: section.sectionType,
          label: section.label,
          order_index: section.orderIndex,
          total_beats: section.totalBeats,
          chords: section.chords.map((chord) => ({
            id: chord.id,
            section_id: chord.sectionId,
            order_index: chord.orderIndex,
            root: chord.root,
            quality: chord.quality,
            chord_name: chord.chordName,
            notes: chord.notes,
            start_beat: chord.startBeat,
            duration_beats: chord.durationBeats,
            parent_mode: chord.parentMode,
          })),
          melodic_notes: section.melodicNotes.map((note) => ({
            id: note.id,
            section_id: note.sectionId,
            pitch: note.pitch,
            start_beat: note.startBeat,
            duration_beats: note.durationBeats,
          })),
        },
      }),
    },
  );

  return mapNextStepResponse(response);
}
