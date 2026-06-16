import { getDefaultTenant, getServices, getStaff } from "@/lib/store";
import { Topbar } from "@/components/operator/Topbar";
import { formatPrice } from "@/lib/utils";
import type { Service } from "@/lib/types";

export default function ServicesPage() {
  const tenant = getDefaultTenant();
  const services = getServices(tenant.id);
  const staff = getStaff(tenant.id);

  // Group by category, preserving first-seen order.
  const categories: string[] = [];
  const byCategory: Record<string, Service[]> = {};
  for (const s of services) {
    if (!byCategory[s.category]) {
      byCategory[s.category] = [];
      categories.push(s.category);
    }
    byCategory[s.category].push(s);
  }

  function staffFor(serviceId: string) {
    return staff.filter((s) => s.serviceIds.includes(serviceId));
  }

  return (
    <>
      <Topbar
        title="Services"
        subtitle={`${services.length} services across ${categories.length} categories`}
        tenantSlug={tenant.slug}
      />
      <div className="flex-1 overflow-auto">
        <div className="fade-in mx-auto max-w-[760px] px-7 pb-14 pt-[22px]">
          <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div className="font-display text-[20px] font-semibold tracking-[-0.01em]">
                Services
              </div>
              <button className="flex h-9 items-center gap-[7px] rounded-[9px] bg-brand px-[14px] text-[13px] font-semibold text-white">
                <span className="text-[15px]">+</span>Add service
              </button>
            </div>

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
                    <div key={s.id} className="flex items-center border-t border-line-soft py-[11px]">
                      <span className="flex-1 text-[13.5px] font-semibold">{s.name}</span>
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
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="h-[18px]" />
          </div>
        </div>
      </div>
    </>
  );
}
