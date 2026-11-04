import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.oneness.dine',
  appName: 'ONENESS Dine',
  webDir: 'build',
  server: {
    // During dev/testing — point to your laptop's IP
    // Comment this out for a standalone production APK
    url: 'http://192.168.31.40:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;