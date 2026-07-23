import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { scope, targetId, limitUsd, periodStart, periodEnd } = body;

    if (scope !== "USER" && scope !== "TEAM") {
      return Response.json({ error: "Invalid scope" }, { status: 400 });
    }
    if (!targetId) {
      return Response.json({ error: "Target is required" }, { status: 400 });
    }
    if (!limitUsd || isNaN(Number(limitUsd)) || Number(limitUsd) <= 0) {
      return Response.json({ error: "Invalid budget limit" }, { status: 400 });
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return Response.json({ error: "Invalid date range" }, { status: 400 });
    }
    if (end <= start) {
      return Response.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        scope,
        userId: scope === "USER" ? targetId : null,
        teamId: scope === "TEAM" ? targetId : null,
        limitUsd: Number(limitUsd),
        periodStart: start,
        periodEnd: end,
      },
    });

    return Response.json({ budget });
  } catch (error) {
    console.error("Error creating budget:", error);
    return Response.json(
      { error: "Failed to create budget", details: String(error) },
      { status: 500 }
    );
  }
}