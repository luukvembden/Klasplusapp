// Typen voor cordova-plugin-inappbrowser (alleen wat wij gebruiken).

interface InAppBrowserGebeurtenis {
  type: 'loadstart' | 'loadstop' | 'loaderror' | 'exit' | 'customscheme';
  url?: string;
  message?: string;
}

interface InAppBrowserVenster {
  addEventListener(type: InAppBrowserGebeurtenis['type'], terug: (e: InAppBrowserGebeurtenis) => void): void;
  close(): void;
}

interface Window {
  cordova?: {
    InAppBrowser: {
      /** '_blank' opent in de app, '_system' in de browser van het toestel. */
      open(url: string, doel: '_blank' | '_system', opties: string): InAppBrowserVenster;
    };
  };
}
