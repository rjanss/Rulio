import { Analytics } from '@vercel/analytics/react';
import RulioEngine from "./components/RulioEngine";

export default function App() {
  return (
    <div className="h-[100dvh] w-full flex flex-col p-6 sm:p-12 bg-black border-[12px] border-[#111]">
      <header className="flex justify-between items-baseline border-b border-zinc-800 pb-6 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tighter">RULIO ENGINE <span className="text-zinc-600 font-light">V1.0</span></h1>
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mt-1">Static Adaptive Neurological Slope</p>
        </div>
        <div className="flex gap-8 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Status</span>
            <span className="text-sm font-bold text-emerald-400">LIVE & TRACKING</span>
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Region</span>
            <span className="text-sm font-bold">GLOBAL EDGE</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 mt-10">
        <RulioEngine sessionDuration={15} />
      </main>

      <footer className="mt-auto flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-zinc-600 pt-6 border-t border-zinc-900 shrink-0">
        <div>Privacy for Humans: No tracking cookies. Anonymous metric collection only.</div>
        <div className="flex gap-6">
          <span>Production Environment</span>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
