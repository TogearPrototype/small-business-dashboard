"use client";

import { useState } from "react";
import type { AppointmentDetail, Client } from "@/lib/types";
import { cx, formatPrice, formatDateLabel } from "@/lib/utils";

interface HistoryEntry {
  date: string;
  service: string;
  staff: string;
  priceCents: number;
}

interface Props {
  clients: Client[];
  upcomingByClient: Record<string, AppointmentDetail[]>;
  historyByClient: Record<string, HistoryEntry[]>;
}

export function ClientsView({ clients, upcomingByClient, historyByClient }: Props) {
  const [selectedId, setSelectedId] = useState(clients[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = clients.find((c) => c.id === selectedId) ?? clients[0];
  const upcoming = selected ? upcomingByClient[selected.id] ?? [] : [];
  const history = selected ? historyByClient[selected.id] ?? [] : [];

  function subtitle(c: Client): string {
    if (c.visits === 0) return "New client";
    return `${c.visits} visits · ${formatPrice(c.totalSpendCents)}`;
  }

  return (
    <div className="fade-in flex h-full">
      {/* list */}
      <div className="flex w-[340px] flex-shrink-0 flex-col border-r border-line">
        <div className="px-5 pb-[14px] pt-5">
          <div className="mb-[14px] flex items-center justify-between">
            <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">Clients</div>
            <span className="tnum text-[12px] font-medium text-ink-ghost">{clients.length}</span>
          </div>
          <div className="flex h-[38px] items-center gap-[9px] rounded-[9px] border border-line px-3">
            <span className="size-[14px] rounded-full border-[1.5px] border-[#c4c4c8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, email…"
              className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-ink-ghost"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cx(
                  "flex w-full items-center gap-3 border-t border-line-soft px-5 py-[13px] text-left",
                  active && "border-t-transparent",
                )}
                style={
                  active
                    ? {
                        background: "color-mix(in oklch, var(--brand) 8%, white)",
                        borderLeft: "2px solid var(--brand)",
                      }
                    : { borderLeft: "2px solid transparent" }
                }
              >
                <span className="size-9 rounded-full" style={{ background: "#ece9ef" }} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold">{c.name}</div>
                  <div className="tnum text-[11.5px] font-medium text-ink-faint">{subtitle(c)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* profile */}
      {selected && (
        <div className="flex-1 overflow-auto px-[30px] py-[26px]">
          <div className="mb-6 flex items-center gap-4">
            <span className="size-[60px] rounded-full" style={{ background: "#e0e0e4" }} />
            <div className="flex-1">
              <div className="font-display text-[24px] font-semibold tracking-[-0.01em]">
                {selected.name}
              </div>
              <div className="tnum text-[13px] font-medium text-ink-faint">
                {selected.phone} · {selected.email}
              </div>
            </div>
            <button className="flex h-[38px] items-center gap-[7px] rounded-[9px] bg-brand px-[15px] text-[13px] font-semibold text-white">
              <span className="text-[15px]">+</span>Book appointment
            </button>
          </div>

          <div className="tnum mb-6 flex gap-3">
            <ProfileStat label="Total spend" value={formatPrice(selected.totalSpendCents)} />
            <ProfileStat label="Visits" value={String(selected.visits)} />
            <ProfileStat label="No-shows" value={String(selected.noShows)} />
          </div>

          {upcoming.length > 0 && (
            <>
              <div className="mb-[10px] text-[13px] font-semibold">Upcoming</div>
              <div className="mb-[22px] flex flex-col gap-2">
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-[12px] border border-line px-4 py-[13px]"
                  >
                    <div className="h-full min-h-[28px] w-[3px] self-stretch rounded-[3px] bg-brand" />
                    <div className="tnum text-[14px] font-bold text-brand">
                      {formatDateLabel(a.date)} · {a.startTime}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-semibold">{a.service.name}</div>
                      <div className="text-[12px] font-medium text-ink-faint">
                        {a.staff.name} · {a.durationMin} min
                      </div>
                    </div>
                    <span className="text-[14px] font-bold">{formatPrice(a.priceCents)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {selected.notes && (
            <>
              <div className="mb-[10px] text-[13px] font-semibold">Notes</div>
              <div className="mb-[22px] rounded-[12px] border border-line px-4 py-3 text-[12.5px] font-medium leading-[1.5] text-ink-soft">
                {selected.notes}
              </div>
            </>
          )}

          <div className="mb-[10px] text-[13px] font-semibold">History</div>
          {history.length > 0 ? (
            <div className="tnum flex flex-col">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-t border-line-soft py-[11px] last:border-b"
                >
                  <span className="w-[86px] text-[12.5px] font-semibold text-ink-soft">{h.date}</span>
                  <span className="flex-1 text-[13px] font-medium">
                    {h.service} · {h.staff}
                  </span>
                  <span className="text-[13px] font-semibold text-ink-soft">
                    {formatPrice(h.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[13px] font-medium text-ink-ghost">No past visits yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-[12px] border border-line px-4 py-[14px]">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-ghost">
        {label}
      </div>
      <div className="mt-1 font-display text-[22px] font-semibold">{value}</div>
    </div>
  );
}
