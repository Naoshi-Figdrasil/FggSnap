import { Injectable } from '@nestjs/common';
import { Link } from './entities/link.entity.js';
import { LinksRepository } from './links.repository.js';

@Injectable()
export class InMemoryLinksRepository implements LinksRepository {
  private readonly linksById = new Map<string, Link>();
  private readonly idByAlias = new Map<string, string>();

  findAll(): Promise<Link[]> {
    return Promise.resolve(Array.from(this.linksById.values()));
  }

  findById(id: string): Promise<Link | undefined> {
    return Promise.resolve(this.linksById.get(id));
  }

  findByAlias(alias: string): Promise<Link | undefined> {
    const id = this.idByAlias.get(alias);
    return Promise.resolve(id ? this.linksById.get(id) : undefined);
  }

  existsByAlias(alias: string): Promise<boolean> {
    return Promise.resolve(this.idByAlias.has(alias));
  }

  save(link: Link): Promise<Link> {
    this.linksById.set(link.id, link);
    this.idByAlias.set(link.alias, link.id);
    return Promise.resolve(link);
  }

  deleteById(id: string): Promise<boolean> {
    const link = this.linksById.get(id);
    if (!link) {
      return Promise.resolve(false);
    }
    this.linksById.delete(id);
    this.idByAlias.delete(link.alias);
    return Promise.resolve(true);
  }
}