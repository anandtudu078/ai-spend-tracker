import { prisma } from "@/lib/prisma";
import UsageUploadForm from "@/components/UsageUploadForm";

export default async function UsagePage() {
  const records = await prisma.usageRecord.findMany({
    orderBy: { occurredAt: "desc" },
    include: { user: true },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Usage</h1>
      <p className="text-gray-500 mb-6">
        Upload a CSV of AI usage to attribute spend to your team.
      </p>

      <UsageUploadForm />

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Recent Usage</h2>

        {records.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No usage records yet. Upload a CSV to get started.
          </p>
        ) : (
          <div className="overflow-x-auto border border-gray-700 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-300">User</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-300">Provider</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-300">Model</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-300">Input Tokens</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-300">Output Tokens</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-300">Cost (USD)</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-800 last:border-0">
                    <td className="px-4 py-2">{record.user.name}</td>
                    <td className="px-4 py-2">{record.provider}</td>
                    <td className="px-4 py-2">{record.model}</td>
                    <td className="px-4 py-2 text-right">
                      {record.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {record.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${record.costUsd.toString()}
                    </td>
                    <td className="px-4 py-2">
                      {record.occurredAt.toISOString().split("T")[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}