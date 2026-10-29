import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.klasplus.app',
  appName: 'Klas+',
  webDir: 'dist',
  // Geen plugin-uitkomsten in het Android/iOS-logboek: daar zouden anders de inlogsleutels in komen.
  loggingBehavior: 'none',
  plugins: {
    // Verzoeken lopen via de native HTTP van het toestel: geen CORS-blokkade.
    CapacitorHttp: { enabled: true },
  },
  cordova: {
    preferences: {
      // De inlogpagina stuurt aan het eind door naar m6loapp://…; de in-app browser meldt dat
      // dan als 'customscheme'-gebeurtenis in plaats van te proberen het te openen.
      AllowedSchemes: 'm6loapp',
    },
  },
};

export default config;
