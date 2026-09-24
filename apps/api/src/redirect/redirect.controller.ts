import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LinksService } from '../links/links.service.js';

@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  // Catch-all single-segment route. This must be registered AFTER
  // LinksModule's routes (see AppModule import order) so that literal
  // paths like /links are not shadowed by this alias parameter.
  @Get(':alias')
  async redirect(@Param('alias') alias: string, @Res() res: Response): Promise<void> {
    // getByAlias() already throws NotFoundException (404) / GoneException (410).
    const link = await this.linksService.getByAlias(alias);
    await this.linksService.incrementClick(link);
    res.redirect(HttpStatusFound, link.originalUrl);
  }
}

// 302 Found — explicit constant to make the redirect's intent unambiguous.
const HttpStatusFound = 302;