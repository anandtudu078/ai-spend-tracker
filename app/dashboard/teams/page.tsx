import { prisma } from "@/lib/prisma";
import CreateTeamForm from "@/components/CreateTeamForm";
import AddTeamMemberForm from "@/components/AddTeamMemberForm";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { user: true },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Teams</h1>
      <p className="text-gray-500 mb-6">
        Create teams and add members to attribute spend at the team level.
      </p>

      <CreateTeamForm />

      <div className="space-y-6">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No teams yet. Create one above to get started.
          </p>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-3">{team.name}</h2>

              {team.memberships.length === 0 ? (
                <p className="text-gray-500 text-sm">No members yet.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {team.memberships.map((m) => (
                    <li key={m.id} className="text-gray-300">
                      {m.user.name} — {m.user.email}
                    </li>
                  ))}
                </ul>
              )}

              <AddTeamMemberForm teamId={team.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}