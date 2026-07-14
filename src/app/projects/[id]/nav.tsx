"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const items = [
  { href: "", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/events", label: "Events" },
  { href: "/templates", label: "Templates" },
  { href: "/workflows", label: "Workflows" },
  { href: "/branding", label: "Branding" },
  { href: "/settings", label: "Settings" },
  { href: "/api-docs", label: "API" },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((item) => {
        const href = `${base}${item.href}`;
        const active =
          item.href === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "op-label transition-colors hover:text-slate-900",
              active ? "text-[#3552e6]" : "text-slate-500"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
