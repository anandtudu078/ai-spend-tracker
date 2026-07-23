import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return Response.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        memberships: {
          create: {
            userId,
          },
        },
      },
    });

    return Response.json({ team });
  } catch (error) {
    console.error("Error creating team:", error);
    return Response.json(
      { error: "Failed to create team", details: String(error) },
      { status: 500 }
    );
  }
}