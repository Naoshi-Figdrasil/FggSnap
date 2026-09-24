import { IsISO8601, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateLinkDto {
  @IsUrl({ require_protocol: true })
  url!: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/, {
    message:
      'customAlias must be 3-32 characters long and contain only letters, numbers, underscores or hyphens',
  })
  customAlias?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}