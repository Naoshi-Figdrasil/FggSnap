import { BadRequestException, ConflictException, GoneException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryLinksRepository } from './in-memory-links.repository.js';
import { LinksService } from './links.service.js';

describe('LinksService', () => {
  let service: LinksService;

  beforeEach(() => {
    service = new LinksService(new InMemoryLinksRepository());
  });

  describe('create', () => {
    it('creates a link with an auto-generated unique alias and stores it', async () => {
      const link = await service.create({ url: 'https://example.com/a' });

      expect(link.alias).toHaveLength(7);
      expect(link.originalUrl).toBe('https://example.com/a');
      expect(link.clicks).toBe(0);

      const stored = await service.getByAlias(link.alias);
      expect(stored).toEqual(link);
    });

    it('creates a link with a custom alias', async () => {
      const link = await service.create({ url: 'https://example.com/b', customAlias: 'my-alias' });

      expect(link.alias).toBe('my-alias');
    });

    it('throws ConflictException when customAlias is already taken', async () => {
      await service.create({ url: 'https://example.com/c', customAlias: 'dup' });

      await expect(
        service.create({ url: 'https://example.com/d', customAlias: 'dup' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException when expiresAt is in the past', async () => {
      await expect(
        service.create({
          url: 'https://example.com/e',
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getByAlias', () => {
    it('returns the link when it exists', async () => {
      const created = await service.create({ url: 'https://example.com/f', customAlias: 'found' });

      const found = await service.getByAlias('found');
      expect(found).toEqual(created);
    });

    it('throws NotFoundException when the alias does not exist', async () => {
      await expect(service.getByAlias('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws GoneException when the link has expired', async () => {
      await service.create({
        url: 'https://example.com/g',
        customAlias: 'expired',
        expiresAt: new Date(Date.now() + 50).toISOString(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await expect(service.getByAlias('expired')).rejects.toBeInstanceOf(GoneException);
    });
  });

  describe('incrementClick', () => {
    it('increments the clicks counter', async () => {
      const link = await service.create({ url: 'https://example.com/h', customAlias: 'clickme' });

      const updated = await service.incrementClick(link);

      expect(updated.clicks).toBe(1);
      const stored = await service.getByAlias('clickme');
      expect(stored.clicks).toBe(1);
    });
  });

  describe('delete', () => {
    it('removes the link', async () => {
      const link = await service.create({ url: 'https://example.com/i', customAlias: 'togo' });

      await service.delete(link.id);

      await expect(service.findById(link.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException when deleting an unknown id', async () => {
      await expect(service.delete('unknown-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});