import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { SectionIcon } from '@/components/section-icon';
import { HeaderPolygons } from '@/components/header-polygons';
import { sectionEntries } from '@/lib/navigation';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout tree={source.getPageTree()} tabs={{
    transform: (option, node) => ({
      ...option,
      url: sectionEntries[option.url] ?? option.url,
      ...(node.icon ? { icon: <div className="flex size-full items-center justify-center [&_svg]:size-full max-md:p-1.5 max-md:rounded-md max-md:border max-md:bg-fd-secondary">{node.icon}</div> } : {}),
    }),
  }} nav={{ title: <><img src="/assets/poly-hammer-icon.svg" alt="" width={24} height={24} className="dark:hidden" /><img src="/assets/poly-hammer-icon-light.svg" alt="" width={24} height={24} className="hidden dark:block" /> Poly Hammer</> }} links={[
    { text: 'Blender Addons', url: sectionEntries['/blender-addons'], icon: <SectionIcon name="blender" /> }, { text: 'Unreal Plugins', url: sectionEntries['/unreal-plugins'], icon: <SectionIcon name="unreal" /> },
    { text: 'Portal', url: sectionEntries['/portal'], icon: <SectionIcon name="portal" /> }, { text: 'CLI', url: sectionEntries['/cli'], icon: <SectionIcon name="cli" /> }, { text: 'Agent Access', url: sectionEntries['/agents'], icon: <SectionIcon name="agent" /> },
  ]} sidebar={{ footer: <div className="flex flex-col gap-2">
    <a href="https://polyhammer.com" className="mt-2 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground focus-visible:outline-2 focus-visible:outline-fd-ring" aria-label="Main website — Poly Hammer">
      Main website
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
    </a>
    <div className="text-xs text-fd-muted-foreground p-3">© 2026 Poly Hammer · <a href="https://github.com/poly-hammer">GitHub</a> · <a href="https://www.youtube.com/@poly-hammer">YouTube</a> · <a href="https://x.com/PolyHammerTools">X</a> · <a href="https://www.linkedin.com/company/poly-hammer">LinkedIn</a></div>
  </div> }}><HeaderPolygons />{children}</DocsLayout>;
}
