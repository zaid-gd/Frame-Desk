export type ProjectGroupInput = { name: string; clientId: string; startDate: string; endDate: string; notes: string };
export type ProjectGroup = ProjectGroupInput & { id: string; archived: boolean; projectCount: number; progress: number; money: number };

export function deriveProjectGroupTotals(projects: readonly { projectGroupId?: string; progress: number; money: number }[], projectGroupId: string) {
  const members = projects.filter((project) => project.projectGroupId === projectGroupId);
  return {
    projectCount: members.length,
    progress: members.length ? Math.round(members.reduce((sum, project) => sum + project.progress, 0) / members.length) : 0,
    money: members.reduce((sum, project) => sum + project.money, 0),
  };
}
