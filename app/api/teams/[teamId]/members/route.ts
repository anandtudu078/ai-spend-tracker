import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { teamId } = await params;
  const body = await req.json();
  const email = body.email?.trim();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return Response.json({ error: "Team not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json(
      { error: `No user found with email: ${email}` },
      { status: 404 }
    );
  }

  const existing = await prisma.teamMembership.findUnique({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId: team.id,
      },
    },
  });

  if (existing) {
    return Response.json(
      { error: `${email} is already on this team` },
      { status: 400 }
    );
  }

  await prisma.teamMembership.create({
    data: {
      userId: user.id,
      teamId: team.id,
    },
  });

  return Response.json({ success: true });
}