"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { AppointmentDetail, Client } from "@/lib/types";
import { searchAction } from "@/app/actions";
import { cx, formatDateLabel } from "@/lib/utils";

/**
 * Global Topbar search. Debounces keystrokes (~150ms), calls the searchAction
 * server action, and renders a results dropdown grouped into Clients and
 * Appointments. Closes on blur (with a small delay so result links register)
 * and on Escape.
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{
    clients: Client[];
    appointments: AppointmentDetail[];
  }>({ clients: [], appointments: [] });
  const [, startTransition] = useTransition();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search whenever the query changes.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ clients: [], appointments: [] });
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await searchAction(q);
        setResults(res);
      });
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  function close() {
    setOpen(false);
  }

  const hasQuery = query.trim().length > 0;
  const hasResults = results.clients.length > 0 || results.appointments.length > 0;
  const showDropdown = open && hasQuery;

  return (
    <div className="relative">
      <div className="flex h-10 w-[240px] items-center gap-[9px] rounded-[10px] border border-line bg-field px-[13px] text-[13px] font-medium focus-within:ring-1 focus-within:ring-brand">
        <span className="size-[14px] flex-shrink-0 rounded-full border-[1.6px] border-[#c4c2c8]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(close, 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              close();
              e.currentTarget.blur();
            }
          }}
          placeholder="Search clients, bookings…"
          className="w-full bg-transparent text-ink placeholder:text-ink-ghost focus:outline-none"
        />
      </div>

      {showDropdown && (
        <div className="fade-in absolute right-0 top-[46px] z-50 w-[340px] overflow-hidden rounded-[13px] border border-line bg-surface shadow-[0_18px_44px_rgba(40,40,46,.16)]">
          {!hasResults && (
            <div className="px-[15px] py-[18px] text-[13px] font-medium text-ink-faint">
              No matches
            </div>
          )}

          {results.clients.length > 0 && (
            <Group label="Clients">
              {results.clients.map((c) => (
                <Link
                  key={c.id}
                  href="/operator/clients"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                  className="flex items-center justify-between gap-3 px-[15px] py-[9px] hover:bg-field"
                >
                  <span className="truncate text-[13.5px] font-medium text-ink">{c.name}</span>
                  <span className="tnum flex-shrink-0 text-[12.5px] font-medium text-ink-faint">
                    {c.phone}
                  </span>
                </Link>
              ))}
            </Group>
          )}

          {results.appointments.length > 0 && (
            <Group label="Appointments">
              {results.appointments.map((a) => (
                <Link
                  key={a.id}
                  href={`/operator/calendar?date=${a.date}&appt=${a.id}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                  className="flex flex-col gap-[2px] px-[15px] py-[9px] hover:bg-field"
                >
                  <span className="truncate text-[13.5px] font-medium text-ink">
                    {a.client.name} · {a.service.name}
                  </span>
                  <span className="text-[12.5px] font-medium text-ink-faint">
                    {formatDateLabel(a.date)}
                  </span>
                </Link>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft py-[5px] last:border-b-0">
      <div className="px-[15px] pb-[3px] pt-[6px] text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
        {label}
      </div>
      {children}
    </div>
  );
}
