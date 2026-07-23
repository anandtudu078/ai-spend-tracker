import { prisma } from "@/lib/prisma";
import SpendByModelChart from "@/components/SpendByModelChart";

export default async function OverviewPage() {
  const records = await prisma.usageRecord.findMany({
    select: { model: true, costUsd: true },
  });

  const totalSpend = records.reduce(
    (sum, r) => sum + Number(r.costUsd),
    0
  );

  const spendByModelMap = new Map<string, number>();
  for (const r of records) {
    const current = spendByModelMap.get(r.model) ?? 0;
    spendByModelMap.set(r.model, current + Number(r.costUsd));
  }
  const spendByModel = Array.from(spendByModelMap.entries()).map(
    ([model, cost]) => ({ model, cost })
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>

      <div className="border rounded-lg p-6 max-w-xs mb-8">
        <p className="text-sm text-gray-500 mb-1">Total Spend</p>
        <p className="text-3xl font-semibold">${totalSpend.toFixed(2)}</p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Spend by Model</h2>
        {spendByModel.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No usage data yet. Upload a CSV from the Usage page to get started.
          </p>
        ) : (
          <SpendByModelChart data={spendByModel} />
        )}
      </div>
    </div>
  );
}