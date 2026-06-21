import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto bg-[#F5F7EF] text-[#1F2A24] lg:h-screen lg:overflow-hidden">
      <main className="mx-auto flex w-full max-w-[1280px] min-h-0 flex-1 flex-col px-5 py-5 sm:px-8 lg:px-10 lg:py-6">

        <section className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full border border-[#DDE5D8] bg-white px-3 py-1 text-xs font-medium text-[#516056] shadow-sm">
              AgroMind
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#1F2A24] sm:text-5xl">
              Autonomous greenhouse scouting for early tomato disease detection.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#667065]">
              Scout robots inspect tomato plants, update a digital twin, and surface targeted treatment recommendations before outbreaks
              spread.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/config"
                className="inline-flex items-center gap-2 rounded-xl border border-[#2E7D32] bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#256629]"
              >
                Start Simulation
                <FiArrowRight aria-hidden="true" />
              </Link>
              <a
                href="https://devpost.com/software/agromind"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#CCD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#39463E] shadow-sm hover:bg-[#FBFCF8]"
              >
                Check out Devpost
              </a>
            </div>
          </div>

          <div className="flex min-h-0 flex-col justify-center">
            <div className="rounded-3xl border border-[#DDE5D8] bg-white p-4 shadow-sm">
              <div className="rounded-2xl border border-[#D9D0B8] bg-[#8B7655] p-4">
                <div className="rounded-2xl border border-[#C8B38C] bg-[#A08A5F] p-6">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F3EA]/85 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A24]">Dashboard preview</p>
                        <p className="text-xs text-[#667065]">Place product screenshot here</p>
                      </div>
                      <div className="rounded-full bg-[#2E7D32] px-3 py-1 text-xs font-semibold text-white">
                        Live scouting
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#D8C8A0] bg-[#F7F3EA]/80 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-[#667065]">Robot</p>
                        <p className="mt-1 text-sm font-semibold text-[#1F2A24]">Autonomous run</p>
                      </div>
                      <div className="rounded-xl border border-[#D8C8A0] bg-[#F7F3EA]/80 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-[#667065]">Belief</p>
                        <p className="mt-1 text-sm font-semibold text-[#1F2A24]">Heatmap updates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#667065]">
                Simulation-first MVP: sensors → robot scouting → mock CV → belief heatmap
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
