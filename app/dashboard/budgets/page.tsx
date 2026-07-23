import { prisma } from "@/lib/prisma";
import CreateBudgetForm from "@/components/CreateBudgetForm";

export default async function BudgetsPage() {
  const [budgets, users, teams] = await Promise.all([
    prisma.budget.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, team: true },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  // For each budget, calculate actual spend within its period, scoped to
  // the right user or team.
  const budgetsWithSpend = await Promise.all(
    budgets.map(async (budget) => {
      let spend = 0;

      if (budget.scope === "USER" && budget.userId) {
        const records = await prisma.usageRecord.findMany({
          where: {
            userId: budget.userId,
            occurredAt: { gte: budget.periodStart, lte: budget.periodEnd },
          },
          select: { costUsd: true },
        });
        spend = records.reduce((sum, r) => sum + Number(r.costUsd), 0);
      } else if (budget.scope === "TEAM" && budget.teamId) {
        const memberIds = (
          await prisma.teamMembership.findMany({
            where: { teamId: budget.teamId },
            select: { userId: true },
          })
        ).map((m) => m.userId);

        const records = await prisma.usageRecord.findMany({
          where: {
            userId: { in: memberIds },
            occurredAt: { gte: budget.periodStart, lte: budget.periodEnd },
          },
          select: { costUsd: true },
        });
        spend = records.reduce((sum, r) => sum + Number(r.costUsd), 0);
      }

      return { ...budget, spend };
    })
  );

  const userOptions = users.map((u) => ({ id: u.id, label: `${u.name} — ${u.email}` }));
  const teamOptions = teams.map((t) => ({ id: t.id, label: t.name }));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Budgets</h1>
      <p className="text-gray-500 mb-6">
        Set spending limits for teams or individuals and track them against real usage.
      </p>

      <CreateBudgetForm users={userOptions} teams={teamOptions} />

      <div className="space-y-4">
        {budgetsWithSpend.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No budgets yet. Create one above to get started.
          </p>
        ) : (
          budgetsWithSpend.map((budget) => {
            const limit = Number(budget.limitUsd);
            const percent = limit > 0 ? Math.min((budget.spend / limit) * 100, 100) : 0;
            const isOverBudget = budget.spend > limit;
            const target = budget.scope === "TEAM" ? budget.team?.name : budget.user?.name;

            return (
              <div key={budget.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{target}</p>
                    <p className="text-xs text-gray-500">
                      {budget.scope === "TEAM" ? "Team budget" : "Individual budget"} ·{" "}
                      {budget.periodStart.toISOString().split("T")[0]} to{" "}
                      {budget.periodEnd.toISOString().split("T")[0]}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      isOverBudget ? "text-red-500" : "text-gray-300"
                    }`}
                  >
                    ${budget.spend.toFixed(2)} / ${limit.toFixed(2)}
                  </p>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isOverBudget ? "bg-red-500" : "bg-[#6c47ff]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {isOverBudget && (
                  <p className="text-red-500 text-xs mt-2">Over budget</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}