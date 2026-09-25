const removableRoles = new Set(["owner", "admin", "pastor"]);

export function canRemoveChurchRecords(role: string | undefined): boolean {
  return role !== undefined && removableRoles.has(role);
}