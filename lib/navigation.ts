import { resolveProductVersion } from '@/lib/published';

const dnaVersion = resolveProductVersion('character-dna');
export const sectionEntries: Record<string, string> = {
  '/blender-addons': dnaVersion ? `/blender-addons/character-dna/${dnaVersion}` : '/blender-addons',
  '/unreal-plugins': '/unreal-plugins/poly-hammer-interchange/getting-started',
  '/portal': '/portal/blender-extension-repo',
  '/cli': '/cli',
  '/agents': '/agents',
};

