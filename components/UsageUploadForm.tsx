"use client";

import { useState } from "react";

type UploadResult = {
  inserted: number;
  skipped: number;
  failed: number;
  errors: { row: number; reason: string }[];
};

export default function UsageUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/usage/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
        return;
      }

      const data: UploadResult = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border rounded-lg p-6 max-w-md">
      <label className="block text-sm font-medium mb-2">
        Choose CSV file
      </label>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4 text-sm"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-[#6c47ff] text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {result && (
        <div className="mt-4 text-sm">
          <p className="text-green-600 font-medium">
            {result.inserted} row{result.inserted !== 1 ? "s" : ""} uploaded successfully.
          </p>
          {result.skipped > 0 && (
            <p className="text-yellow-600 mt-1">
              {result.skipped} row{result.skipped !== 1 ? "s" : ""} skipped (already uploaded).
            </p>
          )}
          {result.failed > 0 && (
            <div className="mt-2 text-red-600">
              <p className="font-medium">
                {result.failed} row{result.failed !== 1 ? "s" : ""} failed:
              </p>
              <ul className="list-disc list-inside mt-1">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}