"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTeamMemberForm({ teamId }: { teamId: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to add member");
        return;
      }

      setEmail("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@company.com"
          className="flex-1 border rounded-md px-3 py-1.5 text-sm bg-transparent"
        />
        <button
          onClick={handleSubmit}
          disabled={!email.trim() || submitting}
          className="bg-[#6c47ff] text-white rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}