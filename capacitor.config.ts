import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a9aa61f288374d78b3c9313418396a4f',
  appName: 'Sistema de Trocas',
  webDir: 'dist',
  server: {
    url: 'https://a9aa61f2-8837-4d78-b3c9-313418396a4f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;
