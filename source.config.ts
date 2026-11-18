import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

const schema = pageSchema.extend({
  product: z.string().optional(),
  version: z.string().optional(),
  channel: z.enum(['staging', 'production', 'local']).optional(),
  sourceCommit: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const authored = defineDocs({
  dir: 'content/authored',
  docs: { schema, postprocess: { includeProcessedMarkdown: true } },
});
export const synced = defineDocs({
  dir: 'content/synced',
  docs: { schema, postprocess: { includeProcessedMarkdown: true } },
});
export default defineConfig();
