import { FileText, Cpu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white shrink-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-indigo-600 text-white font-bold text-lg shadow-sm">
              Q
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">
                OCR Quiz <span className="text-indigo-600">/ Studio</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Document Extraction & Quiz Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-indigo-50/50 px-3 py-1.5 border border-indigo-100">
            <Cpu className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase tracking-wider">Gemini 3.5 Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
