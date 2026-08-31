import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChopSave',
    short_name: 'ChopSave',
    description: 'Rescue great food from nearby Lagos businesses for less.',
    start_url: '/feed',
    display: 'standalone',
    background_color: '#F8F7F0',
    theme_color: '#165C34',
  };
}
