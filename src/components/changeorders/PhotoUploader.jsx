import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, X } from "lucide-react";

const MAX_PHOTOS = 8;

async function compressImage(file, maxDim = 1600, quality = 0.8) {
  if (!file.type?.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = () => resolve(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploader({ value = [], onChange, max = MAX_PHOTOS }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const photos = value || [];

  const handleFiles = async (e) => {
    setError(null);
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const remaining = max - photos.length;
    if (remaining <= 0) { setError(`Maximum ${max} photos.`); return; }
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} exceeds 10MB limit.`);
          continue;
        }
        const compressed = await compressImage(file);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
        const validation = await base44.functions.invoke("validatePhotoUpload", { file_url });
        if (!validation.data?.valid) {
          setError(`${file.name}: ${validation.data?.reason || "invalid file"}`);
          continue;
        }
        uploaded.push({ url: file_url, name: file.name || "photo.jpg" });
      }
      if (uploaded.length > 0) {
        onChange([...photos, ...uploaded]);
      }
      if (files.length > remaining) {
        setError(`Only ${remaining} more photo(s) could be added (max ${max}).`);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx) => onChange(photos.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
          Photos ({photos.length}/{max})
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5 mb-1" />
                <span className="text-[10px]">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <p className="text-xs text-slate-400 mt-1.5">
        Add up to {max} photos of the extra work, site conditions, or damage. Large images are automatically resized.
      </p>
      {error && <p className="text-xs text-amber-600 mt-1">{error}</p>}
    </div>
  );
}