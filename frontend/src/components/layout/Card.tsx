import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, action, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-[#0b1516] p-4 ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-semibold tracking-tight text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
