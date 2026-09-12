import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Workout Tracker',
    short_name: 'Workout',
    description: 'Track your workouts easily.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF4F7',
    theme_color: '#FFF4F7',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
