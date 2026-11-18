import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout tree={source.getPageTree()} nav={{ title: <><img src="/assets/poly-hammer-icon-light.svg" alt="" width={24} height={24} /> Poly Hammer</> }} links={[
    { text: 'Blender Add-ons', url: '/blender-addons' }, { text: 'Unreal Plugins', url: '/unreal-plugins' },
    { text: 'Portal', url: '/portal' }, { text: 'CLI', url: '/cli' }, { text: 'Agent access', url: '/agents' },
  ]} sidebar={{ footer: <div className="text-xs text-fd-muted-foreground p-3">© 2026 Poly Hammer · <a href="https://github.com/poly-hammer">GitHub</a> · <a href="https://www.youtube.com/@poly-hammer">YouTube</a> · <a href="https://x.com/PolyHammerTools">X</a> · <a href="https://www.linkedin.com/company/poly-hammer">LinkedIn</a></div> }}>{children}</DocsLayout>;
}
