"use client";

import { useEffect, useState } from "react";

import { type SongChord } from "@/features/song-editor/lib/mock-song-data";
import {
  type ChordCatalog,
  type ChordCatalogItem,
  type ChordCatalogTab,
} from "@/features/song-editor/lib/chord-catalog";
import { cn } from "@/lib/cn";

type ChordPickerProps = Readonly<{
  catalog: ChordCatalog;
  currentChord: SongChord | null;
  defaultTab: ChordCatalogTab;
  slotLabel: string;
  onClose: () => void;
  onSelect: (item: ChordCatalogItem) => void;
}>;

const tabLabels: Readonly<Record<ChordCatalogTab, string>> = {
  diatonic: "Diatonic",
  secondaryDominant: "Secondary Dominant",
  modalInterchange: "Modal Interchange",
};

function isCurrentChordMatch(item: ChordCatalogItem, currentChord: SongChord | null) {
  if (!currentChord) {
    return false;
  }

  return (
    item.root === currentChord.root &&
    item.quality === currentChord.quality &&
    item.parentMode === currentChord.parentMode
  );
}

export function ChordPicker({
  catalog,
  currentChord,
  defaultTab,
  slotLabel,
  onClose,
  onSelect,
}: ChordPickerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const groups = catalog[activeTab];

  return (
    <div className="w-full rounded-[1.35rem] border border-highlight/80 bg-surface p-4 shadow-[0_22px_70px_-40px_rgba(15,23,42,0.6)] lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
            Chord Picker
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{slotLabel}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-highlight/80 bg-background/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(tabLabels) as ChordCatalogTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
              activeTab === tab
                ? "border-accent/35 bg-accent-soft text-foreground"
                : "border-highlight/80 bg-background/55 text-foreground/72 hover:border-accent/25 hover:text-foreground",
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[min(60vh,34rem)] space-y-4 overflow-y-auto pr-1 lg:max-h-[42rem]">
        {groups.map((group) => (
          <section
            key={group.id}
            className="rounded-[1.2rem] border border-highlight/70 bg-background/45 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
                {group.description ? (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {group.description}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full border border-highlight/80 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65">
                {group.items.length} choices
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {group.items.map((item) => {
                const isCurrent = isCurrentChordMatch(item, currentChord);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={cn(
                      "flex h-full w-full flex-col rounded-[1.1rem] border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                      isCurrent
                        ? "border-accent/35 bg-accent-soft/75"
                        : "border-highlight/80 bg-surface hover:border-accent/25 hover:bg-background/70",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {item.chordName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {item.notes.join(" • ")}
                        </p>
                      </div>

                      {isCurrent ? (
                        <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                          Current
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded-full border border-highlight/80 bg-background/55 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/65"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
