import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";

interface FileUploaderProps {
  onFileLoaded: (base64Data: string, mimeType: string, fileName: string) => void;
  isLoading: boolean;
}

export default function FileUploader({ onFileLoaded, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    previewUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processFile = (file: File) => {
    setError(null);
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload an image (PNG, JPG, WEBP) or a PDF.");
      return;
    }

    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum supported size is 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl is "data:image/png;base64,xxxx..."
      const parts = dataUrl.split(",");
      if (parts.length === 2) {
        const mimeType = file.type;
        const base64Data = parts[1];
        
        setSelectedFile({
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          previewUrl: file.type.startsWith("image/") ? dataUrl : undefined
        });

        onFileLoaded(base64Data, mimeType, file.name);
      } else {
        setError("Error processing file format.");
      }
    };
    reader.onerror = () => {
      setError("An error occurred while reading the file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`flex flex-col items-center justify-center border-2 border-dashed p-10 cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-600 bg-indigo-50/30 scale-[0.99]"
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/20"
          } rounded-xl ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs mb-4">
            <Upload className="h-5 w-5" />
          </div>
          
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Upload document or image
          </h3>
          <p className="text-xs text-slate-500 mb-4 text-center max-w-xs leading-relaxed">
            Drag and drop your files here, or click to browse. Supports PDF documents and high-resolution images.
          </p>
          
          <div className="flex items-center gap-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            <span className="flex items-center gap-1 text-slate-500">
              <FileText className="h-3 w-3" /> PDF
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="flex items-center gap-1 text-slate-500">
              <ImageIcon className="h-3 w-3" /> PNG, JPG, WEBP
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span>Max 20MB</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {selectedFile.previewUrl ? (
                <div className="h-16 w-16 shrink-0 rounded border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
                  <img
                    src={selectedFile.previewUrl}
                    alt="Uploaded preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
                  <FileText className="h-7 w-7" />
                </div>
              )}
              
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">
                    {selectedFile.size}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wide bg-indigo-50 px-1.5 py-0.5 rounded">
                    {selectedFile.type.split("/")[1]}
                  </span>
                </div>
              </div>
            </div>

            {!isLoading && (
              <button
                type="button"
                onClick={clearFile}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-4 mt-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">Error Processing Document</h4>
            <p className="text-xs font-medium mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
