import { useState, ChangeEvent } from "react";
import { Clipboard, Check, Search, RotateCcw, Sparkles } from "lucide-react";

interface TextEditorProps {
  text: string;
  onChange: (newText: string) => void;
  onReset: () => void;
}

export default function TextEditor({ text, onChange, onReset }: TextEditorProps) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleSearchReplace = () => {
    if (!searchQuery) return;
    // Perform search and replace globally
    const escapedSearch = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "g");
    const newText = text.replace(regex, replaceQuery);
    onChange(newText);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-150 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Source Text: Digitized OCR Result
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded hover:bg-slate-200 text-slate-500 transition-colors ${
              searchOpen ? "bg-slate-200 text-slate-800" : ""
            }`}
            title="Search and Replace"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-8 px-3 items-center gap-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 active:bg-slate-50 shadow-2xs transition-all"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Clipboard className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            className="flex h-8 px-3 items-center gap-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-rose-50 hover:text-rose-600 active:text-rose-700 shadow-2xs transition-all"
            title="Upload another file"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Search and Replace Box */}
      {searchOpen && (
        <div className="flex flex-col sm:flex-row gap-2 border-b border-slate-100 bg-slate-50/50 p-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchReplace}
            disabled={!searchQuery}
            className="rounded bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            Replace All
          </button>
        </div>
      )}

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="w-full min-h-[340px] max-h-[550px] resize-y p-6 text-sm font-sans text-slate-800 border-0 outline-hidden focus:ring-0 leading-relaxed font-normal"
          placeholder="Extracted text will appear here. Feel free to edit and correct any word to ensure full accuracy before generating the quiz..."
        />
      </div>

      {/* Footer stats bar */}
      <div className="flex items-center justify-between border-t border-slate-150 bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-3">
          <span>Words: <strong className="text-slate-700 font-bold">{wordCount}</strong></span>
          <span className="h-3 w-px bg-slate-200"></span>
          <span>Characters: <strong className="text-slate-700 font-bold">{charCount}</strong></span>
        </div>
        <div className="text-indigo-600/80 font-bold lowercase">
          editable outputs prevent OCR errors
        </div>
      </div>
    </div>
  );
}
