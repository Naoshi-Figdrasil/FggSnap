import { Module } from '@nestjs/common';
import { InMemoryLinksRepository } from './in-memory-links.repository.js';
import { JsonFileLinksRepository } from './json-file-links.repository.js';
import { LINKS_REPOSITORY } from './links.repository.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';

@Module({
  controllers: [LinksController],
  providers: [
    LinksService,
    {
      provide: LINKS_REPOSITORY,
      useFactory: () =>
        process.env.NODE_ENV === 'test'
          ? new InMemoryLinksRepository()
          : new JsonFileLinksRepository(),
    },
  ],
  exports: [LinksService],
})
export class LinksModule {}