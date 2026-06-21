interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  status?: string;
}

export function PageHeader({ title, subtitle, status }: PageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[#DDE5D8] bg-[#FCFCF8]">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-3 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-[#CFE0CA] bg-[#EAF5EA] text-[#2E7D32]">
            <LuSprout aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-[#1F2A24]">AgroMind</p>
            {title && <p className="text-xs font-medium text-[#2E7D32]">{title}</p>}
            {subtitle && <p className="text-xs text-[#667065]">{subtitle}</p>}
          </div>
        </div>
        {status && (
          <span className="rounded-full border border-[#CFE0CA] bg-[#EAF5EA] px-3 py-1.5 text-xs font-medium text-[#2E7D32]">
            {status}
          </span>
        )}
      </div>
    </header>
  );
}
import { LuSprout } from "react-icons/lu";
