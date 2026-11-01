import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function PhotoGallery({ photos = [], canDelete = false, onDelete }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const list = photos || [];
  if (list.length === 0) return null;

  const close = () => setLightboxIdx(null);
  const prev = (e) => { e?.stopPropagation(); setLightboxIdx((i) => (i - 1 + list.length) % list.length); };
  const next = (e) => { e?.stopPropagation(); setLightboxIdx((i) => (i + 1) % list.length); };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {list.map((p, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={p.url}
              alt={p.name || `Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxIdx(i)}
            />
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={close}>
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {list.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <img
            src={list[lightboxIdx].url}
            alt={list[lightboxIdx].name || "Photo"}
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {list.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
            {lightboxIdx + 1} / {list.length}
          </div>
        </div>
      )}
    </div>
  );
}