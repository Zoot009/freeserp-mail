import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-[#3552e6] text-white hover:bg-[#2a44c9] border border-transparent",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    danger: "bg-white text-red-600 border border-red-300 hover:bg-red-50",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  const styles = {
    primary: "bg-[#3552e6] text-white hover:bg-[#2a44c9]",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
  }[variant];
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3552e6] focus:ring-1 focus:ring-[#3552e6]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-[#3552e6] focus:ring-1 focus:ring-[#3552e6]",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#3552e6] focus:ring-1 focus:ring-[#3552e6] bg-white",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("op-label mb-1.5 block", className)}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#e6e8eb] bg-white p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="op-label mb-2 text-[#3552e6]">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  accent = false,
  hint,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[#e6e8eb] bg-white px-5 py-4">
      <p className="op-label">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-bold tracking-tight",
          accent ? "text-[#3552e6]" : "text-slate-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?: "slate" | "green" | "amber" | "red" | "indigo";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    indigo: "bg-[#eef1fe] text-[#3552e6] border-[#d7ddfb]",
  }[color];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colors
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

/**
 * Minimal dependency-free area chart (inline SVG). Renders a smooth-ish filled
 * area + a couple of x-axis labels. `data` is an ordered list of daily values.
 */
export function AreaChart({
  data,
  height = 220,
  labels,
}: {
  data: number[];
  height?: number;
  labels?: string[];
}) {
  const w = 1000;
  const h = height;
  const pad = 8;
  const max = Math.max(1, ...data);
  const n = data.length;
  const stepX = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const x = (i: number) => pad + i * stepX;

  const linePath = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `M ${x(0).toFixed(1)} ${(h - pad).toFixed(1)} ` +
    data.map((v, i) => `L ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${(h - pad).toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3552e6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#3552e6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={h * g}
            y2={h * g}
            stroke="#eef0f3"
            strokeWidth={1}
          />
        ))}
        {n > 1 && <path d={areaPath} fill="url(#areaFill)" />}
        {n > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#3552e6"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {labels && labels.length > 0 && (
        <div className="mt-2 flex justify-between op-label text-[10px] text-slate-400">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
