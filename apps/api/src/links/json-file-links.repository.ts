import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Link } from './entities/link.entity.js';
import type { LinksRepository } from './links.repository.js';

type StoredLinks = Link[];

export class JsonFileLinksRepository implements LinksRepository {
  private readonly filePath = process.env.LINKS_DATA_FILE ?? './data/links.json';
  private readonly linksById = new Map<string, Link>();
  private readonly idByAlias = new Map<string, string>();

  constructor() {
    this.load();
  }

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
    this.persist();
    return Promise.resolve(link);
  }

  deleteById(id: string): Promise<boolean> {
    const link = this.linksById.get(id);
    if (!link) {
      return Promise.resolve(false);
    }
    this.linksById.delete(id);
    this.idByAlias.delete(link.alias);
    this.persist();
    return Promise.resolve(true);
  }

  private load(): void {
    try {
      const links = JSON.parse(readFileSync(this.filePath, 'utf8')) as StoredLinks;
      for (const link of links) {
        this.linksById.set(link.id, link);
        this.idByAlias.set(link.alias, link.id);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(`Could not read links data from ${this.filePath}`, { cause: error });
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(Array.from(this.linksById.values()), null, 2));
    renameSync(temporaryPath, this.filePath);
  }
}
