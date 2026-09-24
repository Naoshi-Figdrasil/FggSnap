export type Link = {
  id: string;
  alias: string;
  originalUrl: string;
  createdAt: string;
  expiresAt?: string;
  clicks: number;
  shortUrl: string;
};

export type CreateLinkPayload = {
  url: string;
  customAlias?: string;
  expiresAt?: string;
};