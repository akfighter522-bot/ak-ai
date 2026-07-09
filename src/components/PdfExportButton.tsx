import { useState } from "react";
import { jsPDF } from "jspdf";
import { Quiz } from "../types";
import { FileDown, CheckSquare, Eye, Sliders, Settings } from "lucide-react";

interface PdfExportButtonProps {
  quiz: Quiz;
}

export default function PdfExportButton({ quiz }: PdfExportButtonProps) {
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [doubleSpaced, setDoubleSpaced] = useState<boolean>(false);
  const [paperSize, setPaperSize] = useState<"a4" | "letter">("a4");
  const [exporting, setExporting] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);

  const generatePdf = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: paperSize,
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      let currentY = margin;

      // Helper for clean, automatic word-wrapped line output with automatic page breaks
      const addWrappedText = (
        text: string,
        fontSize: number,
        style: "normal" | "bold" | "italic" = "normal",
        color: [number, number, number] = [51, 65, 85],
        spacingBefore = 2,
        spacingAfter = 4
      ) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines: string[] = doc.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.3527 * 1.35; // Convert pt to mm and add standard vertical scale

        currentY += spacingBefore;

        if (currentY + lineHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }

        for (const line of lines) {
          if (currentY + lineHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(line, margin, currentY + fontSize * 0.3527 * 0.85);
          currentY += lineHeight;
        }

        currentY += spacingAfter;
      };

      // Header Banner Title & Info
      addWrappedText(quiz.title, 18, "bold", [15, 23, 42], 0, 2);
      addWrappedText(quiz.description || "Generated Document-Based Quiz", 10.5, "italic", [100, 116, 139], 0, 6);

      // Student metadata writing card
      if (currentY + 22 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.setDrawColor(203, 213, 225); // slate-300 border
      doc.setFillColor(248, 250, 252); // slate-50 fill
      doc.rect(margin, currentY, contentWidth, 18, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Student Name: ____________________________", margin + 6, currentY + 6.5);
      doc.text("Class / Period: ______________", margin + 6, currentY + 12.5);
      doc.text("Date: ______________", margin + contentWidth - 45, currentY + 6.5);
      doc.text("Score: ________ / ____", margin + contentWidth - 45, currentY + 12.5);

      currentY += 24;

      // Render actual questions list
      quiz.questions.forEach((q, index) => {
        const questionNum = index + 1;
        const qSpacing = doubleSpaced ? 8 : 4;

        // Draw question text
        addWrappedText(`${questionNum}. ${q.questionText}`, 11, "bold", [15, 23, 42], qSpacing, 3);

        // Options or writing layouts
        if (q.type === "multiple-choice" && q.choices) {
          q.choices.forEach((choice, choiceIdx) => {
            const prefix = String.fromCharCode(65 + choiceIdx); // A, B, C, D
            addWrappedText(`    [   ]  ${prefix}) ${choice}`, 9.5, "normal", [51, 65, 85], 1, 1.5);
          });
          currentY += doubleSpaced ? 4 : 1.5;
        } else if (q.type === "true-false") {
          addWrappedText(`    [   ]  True`, 9.5, "normal", [51, 65, 85], 1, 1.5);
          addWrappedText(`    [   ]  False`, 9.5, "normal", [51, 65, 85], 1, 1.5);
          currentY += doubleSpaced ? 4 : 1.5;
        } else if (q.type === "short-answer") {
          // Render solid answer sheet lines
          const linesCount = doubleSpaced ? 4 : 3;
          for (let i = 0; i < linesCount; i++) {
            if (currentY + 8 > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
            }
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(margin + 5, currentY + 6, margin + contentWidth - 5, currentY + 6);
            currentY += 8;
          }
          currentY += 3;
        }
      });

      // Answer Key pages (Optional)
      if (includeAnswerKey) {
        doc.addPage();
        currentY = margin;

        addWrappedText("QUIZ ANSWER KEY & EXPLANATIONS", 15, "bold", [15, 23, 42], 0, 4);
        
        doc.setDrawColor(15, 23, 42);
        doc.line(margin, currentY, margin + contentWidth, currentY);
        currentY += 6;

        quiz.questions.forEach((q, index) => {
          const questionNum = index + 1;
          addWrappedText(`Question ${questionNum}: ${q.questionText}`, 10.5, "bold", [15, 23, 42], 4, 1.5);
          
          let displayAns = q.correctAnswer;
          if ((q.type === "multiple-choice" || q.type === "true-false") && q.choices) {
            const choiceIdx = q.choices.indexOf(q.correctAnswer);
            if (choiceIdx !== -1) {
              const letter = String.fromCharCode(65 + choiceIdx);
              displayAns = `${letter}) ${q.correctAnswer}`;
            }
          }

          addWrappedText(`Correct Answer: ${displayAns}`, 9.5, "bold", [21, 128, 61], 1, 1.5);
          addWrappedText(`Explanation: ${q.explanation}`, 9, "normal", [71, 85, 105], 1, 3.5);

          if (index < quiz.questions.length - 1) {
            if (currentY + 10 > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
            } else {
              doc.setDrawColor(241, 245, 249); // slate-100
              doc.line(margin, currentY, margin + contentWidth, currentY);
              currentY += 3.5;
            }
          }
        });
      }

      // Save PDF output
      const cleanTitle = quiz.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 30);
      doc.save(`${cleanTitle || "document"}-quiz.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={generatePdf}
          disabled={exporting}
          className="flex-1 flex justify-center items-center gap-2 rounded bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-5 py-3 text-xs font-bold text-white tracking-wider uppercase shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          <span>{exporting ? "Exporting PDF..." : "Export & Download PDF"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className={`flex h-11 w-11 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer ${
            showOpenOptions() ? "bg-slate-100! text-indigo-600! border-indigo-200!" : ""
          }`}
          title="Export Settings"
        >
          <Sliders className="h-4 w-4" />
        </button>
      </div>

      {showOptions && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5 text-xs animate-fade-in">
          <div className="flex items-center gap-2 border-b border-slate-150 pb-2 mb-1">
            <Settings className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-bold text-slate-500 tracking-widest uppercase text-[10px]">
              PDF Export Options
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 text-[11px]">Include Answer Key & Explanations</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 text-[11px]">Lined / Double Spacing (Writeable)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doubleSpaced}
                onChange={(e) => setDoubleSpaced(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 text-[11px]">Paper Standard Layout</span>
            <div className="flex gap-1 bg-slate-200/50 p-0.5 rounded border border-slate-250">
              {(["a4", "letter"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPaperSize(sz)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    paperSize === sz
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function showOpenOptions() {
    return showOptions;
  }
}
