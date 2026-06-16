"use client";

import { useState, useTransition } from "react";
import type { PaymentSettings } from "@/lib/types";
import { savePaymentSettings } from "@/app/actions";
import { cx } from "@/lib/utils";

const CURRENCIES = [
  { code: "USD", label: "USD · US Dollar" },
  { code: "EUR", label: "EUR · Euro" },
  { code: "GBP", label: "GBP · British Pound" },
  { code: "CAD", label: "CAD · Canadian Dollar" },
  { code: "AUD", label: "AUD · Australian Dollar" },
];

/** Small pill toggle matching the neutral/brand token system. */
function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-[26px] w-[46px] flex-shrink-0 rounded-full transition-colors disabled:opacity-40",
        on ? "bg-brand" : "bg-[#d4d4d8]",
      )}
    >
      <span
        className={cx(
          "absolute top-[3px] size-[20px] rounded-full bg-white shadow-sm transition-[left]",
          on ? "left-[23px]" : "left-[3px]",
        )}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line-soft py-[18px] last:border-b-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[12.5px] font-medium leading-[1.5] text-ink-faint">
          {desc}
        </div>
      </div>
      {children}
    </div>
  );
}

export function PaymentsForm({ settings }: { settings: PaymentSettings }) {
  const [stripeConnected, setStripeConnected] = useState(settings.stripeConnected);
  const [currency, setCurrency] = useState(settings.currency);
  const [requireDeposit, setRequireDeposit] = useState(settings.requireDeposit);
  const [depositPercent, setDepositPercent] = useState(settings.depositPercent);
  const [collectAtBooking, setCollectAtBooking] = useState(settings.collectAtBooking);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [connecting, startConnecting] = useTransition();

  function persist(next: PaymentSettings, flash: boolean) {
    startTransition(async () => {
      await savePaymentSettings(next);
      if (flash) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function current(): PaymentSettings {
    return { stripeConnected, currency, requireDeposit, depositPercent, collectAtBooking };
  }

  // The Stripe connection is a mock — flipping the flag persists immediately so
  // the status card reflects reality without a separate "save".
  function toggleStripe(connected: boolean) {
    setStripeConnected(connected);
    startConnecting(async () => {
      await savePaymentSettings({ ...current(), stripeConnected: connected });
    });
  }

  function save() {
    persist(current(), true);
  }

  return (
    <div className="fade-in flex h-full">
      <div className="flex-1 overflow-auto px-[34px] py-[30px]">
        <div className="max-w-[560px]">
          <div className="mb-1 font-display text-[22px] font-semibold tracking-[-0.01em]">
            Payments
          </div>
          <div className="mb-7 text-[13.5px] font-medium leading-[1.5] text-ink-faint">
            Connect a payment processor and decide whether clients pay a deposit
            when they book.
          </div>

          {/* Stripe Connect status card */}
          <div className="mb-7 rounded-[13px] border border-line bg-field p-[18px]">
            <div className="flex items-center gap-[14px]">
              <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-[11px] bg-[#635bff] font-display text-[18px] font-bold text-white">
                S
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  Stripe Connect
                  {stripeConnected && (
                    <span className="flex items-center gap-[5px] rounded-full bg-brand-tint px-[9px] py-[2px] text-[11px] font-semibold text-brand">
                      <span className="flex size-[13px] items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white">
                        ✓
                      </span>
                      Connected
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12.5px] font-medium leading-[1.5] text-ink-faint">
                  {stripeConnected
                    ? "Your account is linked. Deposits and payouts route through Stripe."
                    : "Link a Stripe account to accept deposits and online payments."}
                </div>
              </div>
              {stripeConnected ? (
                <button
                  type="button"
                  onClick={() => toggleStripe(false)}
                  disabled={connecting}
                  className="flex h-[38px] flex-shrink-0 items-center rounded-[10px] border border-line px-4 text-[13px] font-semibold text-ink-faint transition-colors hover:bg-surface disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleStripe(true)}
                  disabled={connecting}
                  className="flex h-[38px] flex-shrink-0 items-center rounded-[10px] bg-brand px-4 text-[13px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-50"
                >
                  {connecting ? "Connecting…" : "Connect Stripe"}
                </button>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="mb-2 text-[12.5px] font-semibold text-ink-soft">Currency</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mb-7 h-[44px] w-full rounded-[10px] border border-line bg-surface px-[12px] text-[13.5px] font-medium text-ink"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Deposit settings */}
          <div className="rounded-[13px] border border-line px-[18px]">
            <Row
              title="Require a deposit"
              desc="Clients pay part of the price up front to hold the slot."
            >
              <Toggle on={requireDeposit} onChange={setRequireDeposit} />
            </Row>
            <Row
              title="Deposit amount"
              desc="Percentage of the service price collected as a deposit."
            >
              <div
                className={cx(
                  "tnum flex h-[40px] w-[96px] items-center rounded-[10px] border px-[12px] transition-opacity",
                  requireDeposit ? "border-line" : "border-line-soft opacity-40",
                )}
              >
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={depositPercent}
                  disabled={!requireDeposit}
                  onChange={(e) =>
                    setDepositPercent(
                      Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    )
                  }
                  className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none disabled:cursor-not-allowed"
                />
                <span className="text-[13px] font-semibold text-ink-faint">%</span>
              </div>
            </Row>
            <Row
              title="Collect at booking"
              desc="Charge the deposit immediately when the booking is confirmed."
            >
              <Toggle on={collectAtBooking} onChange={setCollectAtBooking} />
            </Row>
          </div>

          {/* Save */}
          <div className="mt-7 flex items-center gap-[10px]">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="flex h-[42px] items-center rounded-[10px] bg-brand px-5 text-[13.5px] font-semibold text-white transition-[filter] hover:brightness-95 disabled:opacity-50"
            >
              {pending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
          </div>

          {/* SaaS reseller note */}
          <div className="mt-7 flex items-start gap-[9px] rounded-[11px] bg-field px-[14px] py-3 text-[12px] font-medium leading-[1.55] text-ink-faint">
            <span className="mt-[1px] flex size-[15px] flex-shrink-0 items-center justify-center rounded-full bg-[#d4d4d8] text-[9px] font-bold text-ink-soft">
              i
            </span>
            <span>
              Real money movement runs through Stripe Connect. Each business
              links its own Stripe account, so funds settle directly to you while
              the platform never touches your balance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
