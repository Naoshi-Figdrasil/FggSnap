import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { customAlphabet } from 'nanoid';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { Link } from './entities/link.entity.js';
import { LINKS_REPOSITORY } from './links.repository.js';
import type { LinksRepository } from './links.repository.js';

const ALIAS_LENGTH = 7;
// URL/filename-safe alphabet, avoids ambiguity issues of the nanoid default charset.
const generateRandomAlias = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ALIAS_LENGTH,
);

const MAX_ALIAS_GENERATION_ATTEMPTS = 5;

@Injectable()
export class LinksService {
  constructor(
    @Inject(LINKS_REPOSITORY) private readonly linksRepository: LinksRepository,
  ) {}

  async create(dto: CreateLinkDto): Promise<Link> {
    if (dto.expiresAt && new Date(dto.expiresAt).getTime() <= Date.now()) {
      throw new BadRequestException('expiresAt must be a date in the future');
    }

    const alias = dto.customAlias
      ? await this.reserveCustomAlias(dto.customAlias)
      : await this.generateUniqueAlias();

    const link: Link = {
      id: randomUUID(),
      alias,
      originalUrl: dto.url,
      createdAt: new Date().toISOString(),
      expiresAt: dto.expiresAt,
      clicks: 0,
    };

    return this.linksRepository.save(link);
  }

  async findAll(): Promise<Link[]> {
    return this.linksRepository.findAll();
  }

  async findById(id: string): Promise<Link> {
    const link = await this.linksRepository.findById(id);
    if (!link) {
      throw new NotFoundException(`Link with id "${id}" not found`);
    }
    return link;
  }

  async getByAlias(alias: string): Promise<Link> {
    const link = await this.linksRepository.findByAlias(alias);
    if (!link) {
      throw new NotFoundException(`Link with alias "${alias}" not found`);
    }
    if (this.isExpired(link)) {
      throw new GoneException(`Link with alias "${alias}" has expired`);
    }
    return link;
  }

  async incrementClick(link: Link): Promise<Link> {
    const updated: Link = { ...link, clicks: link.clicks + 1 };
    return this.linksRepository.save(updated);
  }

  async delete(id: string): Promise<void> {
    // Ensures a 404 is thrown for an unknown id instead of a silent no-op.
    await this.findById(id);
    await this.linksRepository.deleteById(id);
  }

  private isExpired(link: Link): boolean {
    return !!link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
  }

  private async reserveCustomAlias(customAlias: string): Promise<string> {
    const exists = await this.linksRepository.existsByAlias(customAlias);
    if (exists) {
      throw new ConflictException(`Alias "${customAlias}" is already in use`);
    }
    return customAlias;
  }

  private async generateUniqueAlias(): Promise<string> {
    for (let attempt = 0; attempt < MAX_ALIAS_GENERATION_ATTEMPTS; attempt += 1) {
      const candidate = generateRandomAlias();
      const exists = await this.linksRepository.existsByAlias(candidate);
      if (!exists) {
        return candidate;
      }
    }
    throw new ConflictException('Could not generate a unique alias, please try again');
  }
}