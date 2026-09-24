export type Link = {
  id: string;
  alias: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
  clicks: number;
};