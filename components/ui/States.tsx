"use client";

import { cx } from "@/lib/utils";

/**
 * Empty / loading / error primitives — design section 09 ("the data-heavy
 * moments, treated as invitations not afterthoughts"). Brand-tinted where the
 * design tints; neutral otherwise.
 */

type MarkShape = "square" | "circle" | "bang";

function StateMark({ shape }: { shape: MarkShape }) {
  if (shape === "bang") {
    return (
      <div className="mb-[18px] flex size-14 items-center justify-center rounded-[14px] border-[1.5px] border-[#c4c4c8] font-display text-[24px] font-bold text-ink-ghost">
        !
      </div>
    );
  }
  const round = shape === "circle";
  return (
    <div
      className={cx(
        "mb-[18px] flex size-14 items-center justify-center border-[1.5px] border-dashed border-[#c4c4c8]",
        round ? "rounded-full" : "rounded-[14px]",
      )}
    >
      <span
        className={cx(
          "size-[22px] border-[1.5px] border-[#c4c4c8]",
          round ? "rounded-full" : "rounded-[6px]",
        )}
      />
    </div>
  );
}

interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
}

export function EmptyState({
  shape = "square",
  title,
  body,
  actions = [],
  className,
}: {
  shape?: MarkShape;
  title: string;
  body: string;
  actions?: ActionButton[];
  className?: string;
}) {
  return (
    <div
      className={cx(
        "fade-in flex flex-col items-center justify-center px-8 py-12 text-center",
        className,
      )}
    >
      <StateMark shape={shape} />
      <div className="mb-1.5 text-[17px] font-bold">{title}</div>
      <div className="mb-5 max-w-[300px] text-[13px] font-medium leading-[1.5] text-ink-faint">
        {body}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-[10px]">
          {actions.map((a) => (
            <StateAction key={a.label} {...a} />
          ))}
        </div>
      )}
    </div>
  );
}

function StateAction({ label, onClick, href, variant = "primary" }: ActionButton) {
  const cls = cx(
    "flex h-10 items-center justify-center rounded-[10px] px-4 text-[13px] font-semibold transition-[filter,colors]",
    variant === "primary"
      ? "bg-brand text-white hover:brightness-95"
      : "border border-line text-ink-soft hover:bg-field",
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {label}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {label}
    </button>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body = "Check your connection — your data is safe.",
  onRetry,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      shape="bang"
      title={title}
      body={body}
      className={className}
      actions={onRetry ? [{ label: "Try again", onClick: onRetry }] : []}
    />
  );
}

/** Shimmer grid standing in for time-slot chips while availability loads. */
export function SlotSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cx("grid grid-cols-3 gap-[9px] pt-2", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="now-dot h-11 rounded-[11px]"
          style={{ background: i % 3 === 0 ? "#f4f3f5" : "#f7f6f8" }}
        />
      ))}
    </div>
  );
}

/** Skeleton list — pulsing placeholder rows reusing the now-dot keyframe. */
export function SkeletonList({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx("p-[22px]", className)}>
      <div className="mb-[22px] flex items-center gap-3">
        <span className="now-dot size-10 rounded-full bg-line-soft" />
        <div className="flex-1">
          <div className="now-dot mb-2 h-3 w-3/5 rounded-[4px] bg-line-soft" />
          <div className="now-dot h-[10px] w-2/5 rounded-[4px]" style={{ background: "#f0eef2" }} />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="now-dot mb-[11px] h-14 rounded-[11px]"
          style={{ background: i === rows - 1 ? "#f7f6f8" : "#f4f3f5" }}
        />
      ))}
    </div>
  );
}
