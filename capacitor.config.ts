import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'OxygenScan',
  webDir: 'www',
  plugins: {
    PushNotifications: {},
    LocalNotifications: {}
  },
};

export default config;
