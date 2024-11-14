export interface Error {
  response?: {
      data?: {
          error?: string;
      },
      status?: number
  };
  message: string;
}