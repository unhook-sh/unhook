export interface StripePortalResponse {
  url: string;
}

export interface StripeCheckoutResponse {
  url: string;
}

export type SafeActionResponse<T> =
  | {
      success: true;
      data: T;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
    };
