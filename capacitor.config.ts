import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Η εφαρμογή Android για το Google Play: όλα τα αρχεία της (dist/) μέσα στο πακέτο, χωρίς εξάρτηση από το site.
 * Χτίζεται στο GitHub Actions (.github/workflows/android.yml) με `npm run android:sync` και Gradle.
 */
const config: CapacitorConfig = {
  appId: 'gr.klabs.prismaboard',
  appName: 'PrismaBoard',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
