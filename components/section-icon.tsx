const icons = {
  blender: '/assets/section-icons/blender.svg',
  unreal: '/assets/section-icons/unreal.png',
  portal: '/assets/section-icons/web.svg',
  cli: '/assets/section-icons/terminal.svg',
  agent: '/assets/section-icons/agent.svg',
} as const;

export type SectionIconName = keyof typeof icons;

/** Alpha masks inherit the link's contrasting color in both light and dark themes. */
export function SectionIcon({ name }: { name: SectionIconName }) {
  const mask = `url("${icons[name]}")`;
  return <span aria-hidden="true" data-section-icon={name} className="docs-section-icon" style={{ maskImage: mask, WebkitMaskImage: mask }} />;
}

export function isSectionIcon(name: string): name is SectionIconName {
  return Object.hasOwn(icons, name);
}
