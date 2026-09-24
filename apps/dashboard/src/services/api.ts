import { CreateLinkPayload, Link } from '../types/link.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// NestJS's default exception shape is { message, error, statusCode },
// where `message` can be a string (our own thrown exceptions) or a
// string[] (class-validator's ValidationPipe errors).
type ApiErrorBody = { message?: string | string[] };

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // response body wasn't JSON; fall through to the generic message below.
  }
  return `Request failed with status ${response.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('Could not reach the API. Is it running?', 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listLinks(): Promise<Link[]> {
  return request<Link[]>('/links');
}

export function createLink(payload: CreateLinkPayload): Promise<Link> {
  return request<Link>('/links', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteLink(id: string): Promise<void> {
  return request<void>(`/links/${id}`, { method: 'DELETE' });
}