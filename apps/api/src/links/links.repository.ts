import { Link } from './entities/link.entity.js';

/**
 * DI token for LinksRepository. We use a string token instead of the
 * interface itself because TypeScript interfaces don't exist at runtime.
 */
export const LINKS_REPOSITORY = Symbol('LINKS_REPOSITORY');

export interface LinksRepository {
  findAll(): Promise<Link[]>;
  findById(id: string): Promise<Link | undefined>;
  findByAlias(alias: string): Promise<Link | undefined>;
  existsByAlias(alias: string): Promise<boolean>;
  save(link: Link): Promise<Link>;
  deleteById(id: string): Promise<boolean>;
}