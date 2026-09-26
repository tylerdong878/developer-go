import { eggs } from "./eggs";
import { gyms } from "./experience";
import { raids } from "./hackathons";
import { stops } from "./projects";
import { skills, type SkillId, type SkillKind } from "./skills";

export type BagItem = {
  id: SkillId;
  name: string;
  kind: SkillKind;
  /** How many jobs, projects, hackathons, and works in progress use it. */
  count: number;
  learning: boolean;
};

/** Every stack on the map: jobs, projects, hackathon projects, and eggs. */
export function stacks(): SkillId[][] {
  return [
    ...gyms.map((g) => g.stack),
    ...stops.map((s) => s.stack),
    ...raids.map((r) => r.project.stack),
    ...eggs.map((e) => e.stack),
  ];
}

/** Skills as bag items, most used first. Unused skills stay in the bag at 0. */
export function bag(): BagItem[] {
  const counts = new Map<SkillId, number>();
  for (const stack of stacks()) {
    for (const id of new Set(stack)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (Object.keys(skills) as SkillId[])
    .map((id) => {
      const skill: { name: string; kind: SkillKind; learning?: boolean } =
        skills[id];
      return {
        id,
        name: skill.name,
        kind: skill.kind,
        count: counts.get(id) ?? 0,
        learning: skill.learning ?? false,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
