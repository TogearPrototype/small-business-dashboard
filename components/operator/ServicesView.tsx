"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, Staff } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { ServiceEditor } from "./ServiceEditor";
import { EmptyState } from "@/components/ui/States";

/**
 * Interactive services catalog. Keeps the server page's grouped-by-category
 * table look, and layers on a working "Add service" button plus per-row edit
 * (row click / Edit affordance) wired through the service actions.
 */
export function ServicesView({
  services,
  staff,
}: {
  services: Service[];
  staff: Staff[];
}) {
  const router = useRouter();
  // null = no editor; "new" = create modal; a Service = edit that one.
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  // Group by category, preserving first-seen order.
  const { categories, byCategory } = useMemo(() => {
    const categories: string[] = [];
    const byCategory: Record<string, Service[]> = {};
    for (const s of services) {
      if (!byCategory[s.category]) {
        byCategory[s.category] = [];
        categories.push(s.category);
      }
      byCategory[s.category].push(s);
    }
    return { categories, byCategory };
  }, [services]);

  function staffFor(serviceId: string) {
    return staff.filter((s) => s.serviceIds.includes(serviceId));
  }

  function handleSaved() {
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="fade-in mx-auto max-w-[760px] px-7 pb-14 pt-[22px]">
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
              Services
            </div>
            <button
              onClick={() => setEditing("new")}
              className="flex h-9 items-center gap-[7px] rounded-[9px] bg-brand px-[14px] text-[13px] font-semibold text-white transition-[filter] hover:brightness-95"
            >
              <span className="text-[15px]">+</span>Add service
            </button>
          </div>

          {services.length === 0 ? (
            <EmptyState
              title="No services yet"
              body="Add the services you offer so clients can book them online."
              actions={[{ label: "Add service", onClick: () => setEditing("new") }]}
            />
          ) : (
            <>
              <div className="flex border-b border-line px-6 py-[10px] text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-ghost">
                <span className="flex-1">Service</span>
                <span className="w-[78px] text-right">Duration</span>
                <span className="w-[70px] text-right">Price</span>
                <span className="w-[86px] text-right">Staff</span>
              </div>

              {categories.map((cat) => (
                <div key={cat} className="tnum px-6">
                  <div className="py-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                    {cat}
                  </div>
                  {byCategory[cat].map((s) => {
                    const performers = staffFor(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setEditing(s)}
                        className="group flex w-full items-center border-t border-line-soft py-[11px] text-left transition-colors hover:bg-field"
                      >
                        <span className="flex flex-1 items-center gap-2">
                          <span className="text-[13.5px] font-semibold">{s.name}</span>
                          <span className="text-[12px] font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
                            Edit
                          </span>
                        </span>
                        <span className="w-[78px] text-right text-[13px] font-semibold text-ink-soft">
                          {s.durationMin} min
                        </span>
                        <span className="w-[70px] text-right text-[13.5px] font-bold">
                          {formatPrice(s.priceCents)}
                        </span>
                        <span className="flex w-[86px] justify-end">
                          <span className="flex">
                            {performers.slice(0, 3).map((p, i) => (
                              <span
                                key={p.id}
                                className="size-[22px] rounded-full border-2 border-white"
                                style={{ background: "#e0e0e4", marginLeft: i === 0 ? 0 : -8 }}
                                title={p.name}
                              />
                            ))}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="h-[18px]" />
            </>
          )}
        </div>
      </div>

      {editing !== null && (
        <ServiceEditor
          service={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
