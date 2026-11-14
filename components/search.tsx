'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useFetchSearch } from 'fumadocs-core/search/client';
import { SearchDialog, SearchDialogContent, SearchDialogHeader, SearchDialogInput, SearchDialogList, SearchDialogOverlay, SearchDialogClose, SearchDialogFooter, type SharedProps } from 'fumadocs-ui/components/dialog/search';

export function DocsSearch(props: SharedProps) {
  const pathname = usePathname();
  const [broaden, setBroaden] = useState(false);
  const parts = pathname.split('/').filter(Boolean);
  const scope = parts[0] === 'blender-addons' && parts[1] && parts[2] ? `${parts[1]}:${parts[2]}` : 'current';
  const search = useFetchSearch({ tag: broaden ? 'all' : scope });
  return <SearchDialog {...props} {...search}><SearchDialogOverlay /><SearchDialogContent><SearchDialogHeader><SearchDialogInput /><SearchDialogClose /></SearchDialogHeader><SearchDialogList /><SearchDialogFooter><label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={broaden} onChange={event => setBroaden(event.target.checked)} />Search all published versions</label></SearchDialogFooter></SearchDialogContent></SearchDialog>;
}
