"use client";

import { useState, useTransition } from "react";
import type { Tenant } from "@/lib/types";
import { saveBusinessProfile } from "@/app/actions";

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific — Los Angeles" },
  { value: "America/Denver", label: "Mountain — Denver" },
  { value: "America/Chicago", label: "Central — Chicago" },
  { value: "America/New_York", label: "Eastern — New York" },
  { value: "Europe/London", label: "GMT — London" },
  { value: "Europe/Paris", label: "Central European — Paris" },
];

export function BusinessProfileForm({ tenant }: { tenant: Tenant }) {
  const [name, setName] = useState(tenant.name);
  const [tagline, setTagline] = useState(tenant.tagline);
  const [address, setAddress] = useState(tenant.address);
  const [phone, setPhone] = useState(tenant.phone);
  const [email, setEmail] = useState(tenant.email);
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveBusinessProfile({ name, tagline, address, phone, email, timezone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function reset() {
    setName(tenant.name);
    setTagline(tenant.tagline);
    setAddress(tenant.address);
    setPhone(tenant.phone);
    setEmail(tenant.email);
    setTimezone(tenant.timezone);
  }

  const inputClass =
    "h-[44px] w-full rounded-[10px] border border-line px-[14px] text-[13.5px] font-medium text-ink focus:border-brand focus:outline-none";

  return (
    <div className="fade-in flex-1 overflow-auto px-[34px] py-[30px]">
      <div className="max-w-[440px]">
        <div className="mb-1 font-display text-[22px] font-semibold tracking-[-0.01em]">
          Business profile
        </div>
        <div className="mb-7 text-[13.5px] font-medium leading-[1.5] text-ink-faint">
          Your name, contact details and timezone. These appear on your public booking site and on
          client confirmations.
        </div>

        {/* name */}
        <div className="mb-[18px]">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Business name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lumen Studio"
            className={inputClass}
          />
        </div>

        {/* tagline */}
        <div className="mb-[18px]">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Tagline</div>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Hair & Skin"
            className={inputClass}
          />
        </div>

        {/* address */}
        <div className="mb-[18px]">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Address</div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="24 Pearl St"
            className={inputClass}
          />
        </div>

        {/* phone */}
        <div className="mb-[18px]">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Phone</div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(415) 555-0100"
            className={`tnum ${inputClass}`}
          />
        </div>

        {/* email */}
        <div className="mb-[18px]">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@yourbusiness.com"
            className={inputClass}
          />
        </div>

        {/* timezone */}
        <div className="mb-7">
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Timezone</div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={`${inputClass} cursor-pointer appearance-none bg-field`}
          >
            {TIMEZONES.some((z) => z.value === timezone) ? null : (
              <option value={timezone}>{timezone}</option>
            )}
            {TIMEZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-[12px] font-medium text-ink-ghost">
            Used for the calendar grid and all booking times.
          </div>
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
            onClick={reset}
            className="flex h-[42px] items-center rounded-[10px] border border-line px-5 text-[13.5px] font-semibold text-ink-faint hover:bg-field"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
