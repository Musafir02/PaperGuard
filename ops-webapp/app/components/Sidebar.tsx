"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "◉" },
  { href: "/dashboard/centers", label: "Centers", icon: "◈" },
  { href: "/dashboard/center-risk", label: "Center Risk", icon: "⚡" },
  { href: "/dashboard/translate", label: "Translate", icon: "🌐" },
  { href: "/dashboard/watermark", label: "Watermark", icon: "◎" },
  { href: "/dashboard/translator-shield", label: "Translator Shield", icon: "⛊" },
  { href: "/dashboard/preprint", label: "Pre-Print", icon: "🔒" },
  { href: "/dashboard/printer-fp", label: "Printer FP", icon: "⊞" },
  { href: "/dashboard/forensics", label: "Forensics", icon: "⊛" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "⚠" },
  { href: "/dashboard/audit", label: "Audit", icon: "≡" },
  { href: "/dashboard/killswitch", label: "Kill Switch", icon: "✕" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col min-h-screen">
      <div className="p-4 border-b border-border">
        <h1 className="text-accent font-mono font-bold text-lg tracking-wider">PAPERGUARD</h1>
        <p className="text-muted text-xs mt-1">Ops Console v1.0</p>
      </div>
      <nav className="flex-1 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent border-r-2 border-accent"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span className="text-xs w-4">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border text-xs text-muted">
        <span className="inline-block w-2 h-2 bg-green rounded-full mr-1"></span>
        System Online
      </div>
    </aside>
  );
}
