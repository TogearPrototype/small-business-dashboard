"use client";

import { useState, useTransition } from "react";
import type { NotificationPrefs } from "@/lib/types";
import { saveNotificationPrefs } from "@/app/actions";

const LEAD_OPTIONS = [
  { value: 1, label: "1 hour" },
  { value: 2, label: "2 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`ring-brand relative h-[26px] w-[46px] flex-shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-[#d4d4d8]"
      }`}
    >
      <span
        className={`absolute top-[3px] size-[20px] rounded-full bg-white shadow-sm transition-[left] ${
          checked ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function Row({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft py-[18px] last:border-b-0">
      <div className="flex-1">
        <div className="mb-0.5 text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="text-[12.5px] font-medium leading-[1.5] text-ink-faint">
          {description}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function NotificationsForm({ prefs }: { prefs: NotificationPrefs }) {
  const [form, setForm] = useState<NotificationPrefs>(prefs);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      await saveNotificationPrefs(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const remindersEnabled = form.smsReminders || form.emailReminders;

  return (
    <div className="fade-in flex h-full">
      <div className="flex flex-1 overflow-auto px-[34px] py-[30px]">
        <div className="max-w-[520px] flex-1">
          <div className="mb-1 font-display text-[22px] font-semibold tracking-[-0.01em]">
            Notifications
          </div>
          <div className="mb-7 text-[13.5px] font-medium leading-[1.5] text-ink-faint">
            Choose which messages we send to your clients and when reminders go out.
          </div>

          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-ghost">
            Confirmations & reminders
          </div>
          <div className="mb-7 rounded-[13px] border border-line px-[18px]">
            <Row
              title="Email confirmations"
              description="Send a confirmation email when a booking is made."
              checked={form.emailConfirmations}
              onChange={(v) => set("emailConfirmations", v)}
            />
            <Row
              title="Email reminders"
              description="Email clients ahead of their appointment."
              checked={form.emailReminders}
              onChange={(v) => set("emailReminders", v)}
            />
            <Row
              title="SMS reminders"
              description="Text clients ahead of their appointment."
              checked={form.smsReminders}
              onChange={(v) => set("smsReminders", v)}
            />
          </div>

          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Reminder timing</div>
          <div className="mb-3 text-[12px] font-medium leading-[1.5] text-ink-ghost">
            How far before the appointment reminders are sent.
          </div>
          <div className={`mb-7 flex gap-[9px] ${remindersEnabled ? "" : "opacity-50"}`}>
            {LEAD_OPTIONS.map((opt) => {
              const active = form.reminderLeadHours === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!remindersEnabled}
                  onClick={() => set("reminderLeadHours", opt.value)}
                  className={`tnum flex h-[42px] flex-1 items-center justify-center rounded-[10px] border text-[13px] font-semibold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? "border-brand bg-brand-tint text-brand"
                      : "border-line text-ink-faint hover:bg-field"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-ghost">
            Marketing
          </div>
          <div className="mb-8 rounded-[13px] border border-line px-[18px]">
            <Row
              title="Marketing emails"
              description="Send occasional promotions and updates to clients."
              checked={form.marketingEmails}
              onChange={(v) => set("marketingEmails", v)}
            />
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={save}
              disabled={pending}
              className="flex h-[42px] items-center rounded-[10px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-50"
            >
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
            <button
              onClick={() => setForm(prefs)}
              className="flex h-[42px] items-center rounded-[10px] border border-line px-5 text-[13.5px] font-semibold text-ink-faint hover:bg-field"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
