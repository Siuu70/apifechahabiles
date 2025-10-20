export interface CalculationQuery {
  readonly days?: number;
  readonly hours?: number;
  readonly date?: string;
}

export interface CalculationRequest {
  readonly days?: number;
  readonly hours?: number;
  readonly startUtcMs: number;
}

export interface SuccessResponseBody {
  readonly date: string;
}

export interface ErrorResponseBody {
  readonly error: string;
  readonly message: string;
}

export interface HolidayCacheEntry {
  readonly year: number;
  readonly days: Set<string>;
}
