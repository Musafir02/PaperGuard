"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { divider: true, label: "Operations" },
  { href: "/dashboard/centers", label: "Centers" },
  { href: "/dashboard/center-risk", label: "Risk Assessment" },
  { href: "/dashboard/translate", label: "Translate" },
  { divider: true, label: "Security" },
  { href: "/dashboard/watermark", label: "Watermark" },
  { href: "/dashboard/translator-shield", label: "Translator Shield" },
  { href: "/dashboard/preprint", label: "Pre-Print" },
  { href: "/dashboard/printer-fp", label: "Printer FP" },
  { divider: true, label: "Response" },
  { href: "/dashboard/forensics", label: "Forensics" },
  { href: "/dashboard/alerts", label: "Alerts" },
  { href: "/dashboard/audit", label: "Audit Chain" },
  { href: "/dashboard/killswitch", label: "Kill Switch" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="w-[220px] bg-bg-secondary border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-accent/15 flex items-center justify-center">
            <span className="text-accent text-xs font-bold font-mono">PG</span>
          </div>
          <div>
            <h1 className="text-[13px] font-semibold tracking-wide text-text-primary">PaperGuard</h1>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Ops Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {NAV.map((item, i) => {
          if ("divider" in item && item.divider) {
            return (
              <div key={i} className="mt-5 mb-1.5 px-2">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
            );
          }

          if (!("href" in item)) return null;
          const href: string = item.href as string;

          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`block px-2.5 py-[7px] text-[13px] rounded-[6px] transition-all duration-150 mb-[2px] ${
                active
                  ? "bg-accent-dim text-accent font-medium"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot"></span>
          <span className="text-[11px] text-text-muted">System Online</span>
        </div>
      </div>
    </aside>
  );
}
