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
    <section className={`rounded-xl border border-[#DDE5D8] bg-white p-4 shadow-sm ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-semibold tracking-tight text-[#1F2A24]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs leading-5 text-[#667065]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
