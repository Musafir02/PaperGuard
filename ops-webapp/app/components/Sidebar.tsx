"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(sessionStorage.getItem("user_role"));
      setUsername(sessionStorage.getItem("username"));
      setCenterId(sessionStorage.getItem("center_id"));
    }
  }, [pathname]);

  if (pathname === "/") return null;

  const logout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const getNavItems = () => {
    const overviewLink = { href: "/dashboard", label: "Overview" };

    if (role === "invigilator") {
      return [
        overviewLink,
        { divider: true, label: "Operations" },
        { href: "/dashboard/centers", label: "Students" }
      ];
    }

    if (role === "center_officer") {
      return [
        overviewLink,
        { divider: true, label: "Operations" },
        { href: "/dashboard/centers", label: "Center Dashboard" },
        { href: "/dashboard/preprint", label: "Pre-Print Control" }
      ];
    }

    return [
      overviewLink,
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
      { href: "/dashboard/killswitch", label: "Kill Switch" }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-[220px] bg-[#0f0f12] border-r border-[#232329] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-[#232329]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#c2835e]/15 flex items-center justify-center border border-[#c2835e]/30">
            <span className="text-[#c2835e] text-xs font-bold font-mono">PG</span>
          </div>
          <div>
            <h1 className="text-[13px] font-semibold tracking-wide text-[#e4e4e7]">PaperGuard</h1>
            <p className="text-[10px] text-[#52525b] font-mono uppercase tracking-widest">Ops Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {navItems.map((item, i) => {
          if ("divider" in item && item.divider) {
            return (
              <div key={i} className="mt-5 mb-1.5 px-2">
                <span className="text-[10px] font-medium text-[#52525b] uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
            );
          }

          if (!("href" in item)) return null;
          const href = item.href as string;
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`block px-2.5 py-[7px] text-[13px] rounded-[6px] transition-all duration-150 mb-[2px] ${
                active
                  ? "bg-[#c2835e]/12 text-[#c2835e] font-medium border-l-2 border-[#c2835e] pl-2"
                  : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#1f1f25]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#232329] bg-[#141418]/50 space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[#e4e4e7] truncate">{username}</p>
          <p className="text-[10px] font-mono text-[#52525b] uppercase truncate">
            {role?.replace("_", " ")}
          </p>
          {centerId && centerId !== "ALL" && (
            <p className="text-[10px] font-mono text-[#c2835e] truncate">
              Center: {centerId}
            </p>
          )}
        </div>
        <button
          onClick={logout}
          className="w-full py-1.5 border border-[#232329] hover:bg-[#1f1f25] text-xs text-[#a1a1aa] hover:text-white rounded-[6px] transition-all font-medium"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
