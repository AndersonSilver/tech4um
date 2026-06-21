interface GoogleCodeResponse {
  code: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GoogleCodeClient {
  requestCode: () => void;
}

interface GoogleOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup" | "redirect";
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleCodeClient;
}

interface Window {
  google?: {
    accounts: {
      oauth2: GoogleOAuth2;
    };
  };
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}
