import { authored, synced } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({ authored: authored.toFumadocsSource(), synced: synced.toFumadocsSource() }, { baseUrl: '/' });
export type DocPage = ReturnType<typeof source.getPages>[number];
