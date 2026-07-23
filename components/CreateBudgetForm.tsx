"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export default function CreateBudgetForm({
  users,
  teams,
}: {
  users: Option[];
  teams: Option[];
}) {
  const [scope, setScope] = useState<"USER" | "TEAM">("TEAM");
  const [targetId, setTargetId] = useState("");
  const [limitUsd, setLimitUsd] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const options = scope === "USER" ? users : teams;

  async function handleSubmit() {
    if (!targetId || !limitUsd || !periodStart || !periodEnd) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, targetId, limitUsd, periodStart, periodEnd }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create budget");
        return;
      }

      setTargetId("");
      setLimitUsd("");
      setPeriodStart("");
      setPeriodEnd("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border rounded-lg p-6 max-w-lg mb-8">
      <h2 className="text-lg font-semibold mb-4">Create a budget</h2>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={scope === "TEAM"}
            onChange={() => {
              setScope("TEAM");
              setTargetId("");
            }}
          />
          Team
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={scope === "USER"}
            onChange={() => {
              setScope("USER");
              setTargetId("");
            }}
          />
          Individual
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {scope === "TEAM" ? "Team" : "Person"}
        </label>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
        >
          <option value="">Select {scope === "TEAM" ? "a team" : "a person"}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id} className="bg-black">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Budget limit (USD)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={limitUsd}
          onChange={(e) => setLimitUsd(e.target.value)}
          placeholder="500.00"
          className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Start date</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">End date</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!targetId || !limitUsd || !periodStart || !periodEnd || submitting}
        className="bg-[#6c47ff] text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating..." : "Create Budget"}
      </button>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
}