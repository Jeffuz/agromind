interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  status?: string;
}

export function PageHeader({ title, subtitle, status }: PageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-emerald-950/80 bg-[#07110f]/90">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-3 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-800 bg-emerald-950/60 text-emerald-400">
            <LuSprout aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">AgroMind</p>
            {title && <p className="text-xs font-medium text-emerald-400">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {status && (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            {status}
          </span>
        )}
      </div>
    </header>
  );
}
import { LuSprout } from "react-icons/lu";
