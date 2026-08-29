import type { MinistryTeam, MinistryProfile } from "@workspace/db";

export function teamResponse(
  team: MinistryTeam,
  members: MinistryProfile[],
) {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    isArchived: team.isArchived,
    memberCount: members.length,
    members: members.map((member) => ({
      id: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      email: member.email,
      completedAt: member.completedAt,
    })),
  };
}