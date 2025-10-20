import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  addBusinessDays,
  addBusinessHours,
  alignToPreviousWorkingMoment,
  localToUtcTimestamp,
  utcToLocalTimestamp,
} from "./businessTime";
import { TIME_ZONE_IDENTIFIER } from "./constants";
import { preloadHolidayRange } from "./holidays";
import { CalculationQuery, CalculationRequest, ErrorResponseBody, SuccessResponseBody } from "./types";

const DEFAULT_PORT: number = 3000;
const ROUTE_PATH: string = "/working-date";

preloadHolidayRange(new Date().getUTCFullYear());

function parsePositiveInteger(value: string, field: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`El parámetro ${field} debe ser un entero positivo`);
  }
  const parsed: number = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`El parámetro ${field} debe ser un entero positivo`);
  }
  return parsed;
}

function parseQueryParameters(url: URL): CalculationQuery {
  const daysParam: string | null = url.searchParams.get("days");
  const hoursParam: string | null = url.searchParams.get("hours");
  const dateParam: string | null = url.searchParams.get("date");

  const daysValue: number | undefined = daysParam !== null && daysParam.length > 0
    ? parsePositiveInteger(daysParam, "days")
    : undefined;

  const hoursValue: number | undefined = hoursParam !== null && hoursParam.length > 0
    ? parsePositiveInteger(hoursParam, "hours")
    : undefined;

  const dateValue: string | undefined = dateParam !== null && dateParam.length > 0 ? dateParam : undefined;

  return {
    days: daysValue,
    hours: hoursValue,
    date: dateValue,
  };
}

function determineStartUtc(query: CalculationQuery): number {
  if (query.date !== undefined) {
    if (!query.date.endsWith("Z")) {
      throw new Error("El parámetro date debe terminar con 'Z' para indicar que está en UTC");
    }
    const parsed: number = Date.parse(query.date);
    if (Number.isNaN(parsed)) {
      throw new Error("El parámetro date debe ser una cadena ISO-8601 válida");
    }
    return parsed;
  }
  return Date.now();
}

function validateRequest(query: CalculationQuery): CalculationRequest {
  if (query.days === undefined && query.hours === undefined) {
    throw new Error("Debe proporcionar al menos uno de los parámetros days u hours");
  }

  const startUtcMs: number = determineStartUtc(query);

  return {
    days: query.days,
    hours: query.hours,
    startUtcMs,
  };
}

function sendJson(res: ServerResponse, statusCode: number, body: SuccessResponseBody | ErrorResponseBody): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function buildSuccessResponse(dateUtc: string): SuccessResponseBody {
  return { date: dateUtc };
}

function buildErrorResponse(message: string): ErrorResponseBody {
  return { error: "InvalidParameters", message };
}

function handleCalculation(request: CalculationRequest): SuccessResponseBody {
  const startLocal: number = utcToLocalTimestamp(request.startUtcMs);
  let alignedLocal: number = alignToPreviousWorkingMoment(startLocal);

  if (request.days !== undefined) {
    alignedLocal = addBusinessDays(alignedLocal, request.days);
  }

  if (request.hours !== undefined) {
    alignedLocal = addBusinessHours(alignedLocal, request.hours);
  }

  const resultUtc: number = localToUtcTimestamp(alignedLocal);
  const dateText: string = new Date(resultUtc).toISOString();
  return buildSuccessResponse(dateText);
}

const server = createServer((req: IncomingMessage, res: ServerResponse): void => {
  if (req.method !== "GET") {
    sendJson(res, 405, buildErrorResponse("Solo se permiten solicitudes GET"));
    return;
  }

  const requestUrl: string = req.url ?? "/";
  const url: URL = new URL(requestUrl, "http://localhost");

  if (url.pathname !== ROUTE_PATH) {
    sendJson(res, 404, buildErrorResponse("Ruta no encontrada"));
    return;
  }

  try {
    const query: CalculationQuery = parseQueryParameters(url);
    const request: CalculationRequest = validateRequest(query);
    const response: SuccessResponseBody = handleCalculation(request);
    sendJson(res, 200, response);
  } catch (error) {
    const message: string = error instanceof Error ? error.message : "Error inesperado";
    sendJson(res, 400, buildErrorResponse(message));
  }
});

const portText: string | undefined = process.env.PORT;
const port: number = portText !== undefined ? Number.parseInt(portText, 10) : DEFAULT_PORT;

server.listen(Number.isFinite(port) ? port : DEFAULT_PORT, (): void => {
  const actualPort: number = Number.isFinite(port) ? port : DEFAULT_PORT;
  // eslint-disable-next-line no-console
  console.log(`Working days API listening on port ${actualPort} (timezone: ${TIME_ZONE_IDENTIFIER})`);
});
