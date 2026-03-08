import { useRef } from "react";

const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/pdf": "PDF",
};

const ACCEPT_ATTR = Object.keys(ACCEPTED_TYPES).join(",");
const MAX_SIZE_MB = 10;

interface AttachmentUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  hasExistingAttachment?: boolean;
  uploading?: boolean;
  uploadError?: string | null;
  disabled?: boolean;
}

export function AttachmentUploader({
  file,
  onFileChange,
  hasExistingAttachment,
  uploading,
  uploadError,
  disabled,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES[selected.type]) return;
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) return;
    onFileChange(selected);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (disabled || uploading) return;
    const dropped = e.dataTransfer.files[0];
    if (!dropped || !ACCEPTED_TYPES[dropped.type]) return;
    if (dropped.size > MAX_SIZE_MB * 1024 * 1024) return;
    onFileChange(dropped);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  const typeLabel = file ? ACCEPTED_TYPES[file.type] : null;
  const sizeLabel = file
    ? file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-widest">
          Adjunto
        </span>
        {hasExistingAttachment && !file && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-gold/70 bg-gold/8 border border-gold/20 rounded-md px-2 py-0.5">
            <span className="w-1 h-1 rounded-full bg-gold/60 inline-block" />
            Tiene adjunto
          </span>
        )}
      </div>

      {file ? (
        /* File selected — show preview card */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/4">
          <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            {file.type === "application/pdf" ? (
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="14"
                height="14"
                className="text-gold/80"
              >
                <path d="M4 1.75A.75.75 0 014.75 1h4.5a.75.75 0 01.53.22l3 3a.75.75 0 01.22.53v9.25a.75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75V1.75zm1.5.75v11h7V5.5h-2.75A.75.75 0 019 4.75V2h-3.5zM10.5 2.56L12.44 4.5H10.5V2.56z" />
                <path d="M6.25 7.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5zm0 3a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="14"
                height="14"
                className="text-gold/80"
              >
                <path d="M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V5.5h-3.75A1.75 1.75 0 019 3.75V0H1.75zm7.75.56V3.75c0 .138.112.25.25.25h3.69L9.5 3.06zM0 2.75C0 1.784.784 1 1.75 1H9.5a.75.75 0 01.53.22l4.5 4.5c.141.14.22.331.22.53v8A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V2.75zm7.22 4.53a.75.75 0 011.06-1.06l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.06-1.06L9.19 9.5 7.22 7.53zM4.28 8.97a.75.75 0 011.06 1.06L3.31 11.5l2.03 1.97a.75.75 0 01-1.06 1.06l-2.5-2.5a.75.75 0 010-1.06l2.5-2.5z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90 truncate font-medium">
              {file.name}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              {typeLabel} · {sizeLabel}
            </p>
          </div>

          {uploading ? (
            <div className="shrink-0">
              <svg
                className="animate-spin text-gold/60"
                viewBox="0 0 24 24"
                fill="none"
                width="16"
                height="16"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onFileChange(null)}
              disabled={disabled}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/8 transition disabled:pointer-events-none"
              aria-label="Quitar archivo"
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                width="12"
                height="12"
              >
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={disabled || uploading}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-white/12 bg-white/2 text-white/30 hover:border-white/20 hover:text-white/50 hover:bg-white/4 transition cursor-pointer disabled:pointer-events-none disabled:opacity-40 text-left"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            width="14"
            height="14"
            className="shrink-0"
          >
            <path d="M2.5 3.25a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5H3.25a.75.75 0 01-.75-.75zM8.75 6a.75.75 0 00-1.5 0v3.69L5.28 7.72a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 00-1.06-1.06L8.75 9.69V6z" />
          </svg>
          <span className="text-sm flex-1">
            {hasExistingAttachment
              ? "Reemplazar adjunto…"
              : "Adjuntar archivo…"}
          </span>
          <span className="text-[10px] font-mono tracking-wide text-white/20">
            JPG · PNG · PDF
          </span>
        </button>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            width="11"
            height="11"
            className="shrink-0"
          >
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {uploadError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleFileSelect}
        className="sr-only"
        aria-hidden="true"
      />
    </div>
  );
}
