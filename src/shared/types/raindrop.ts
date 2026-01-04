export interface RaindropBookmark {
  link: string;
  title: string;
  excerpt?: string;
  tags: string[];
  collection?: {
    $id: number;
  };
  created?: string;
}

export interface RaindropCollection {
  _id: number;
  title: string;
  count: number;
}

export interface RaindropApiResponse<T> {
  result: boolean;
  item?: T;
  items?: T[];
  errorMessage?: string;
}

export class RaindropApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'RaindropApiError';
  }
}

export class RateLimitError extends RaindropApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class AuthError extends RaindropApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthError';
  }
}
