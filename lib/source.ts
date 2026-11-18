import { authored, synced } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { createElement } from 'react';
import { isSectionIcon, SectionIcon } from '@/components/section-icon';

export const source = loader({ authored: authored.toFumadocsSource(), synced: synced.toFumadocsSource() }, {
  baseUrl: '/',
  icon: name => name && isSectionIcon(name) ? createElement(SectionIcon, { name }) : undefined,
});
export type DocPage = ReturnType<typeof source.getPages>[number];
