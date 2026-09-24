import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { LinksModule } from './links/links.module.js';
import { RedirectModule } from './redirect/redirect.module.js';

@Controller('health')
class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok' };
  }
}

@Module({
  // Order matters: LinksModule's literal "/links" routes must be
  // registered before RedirectModule's catch-all "/:alias" route.
  imports: [LinksModule, RedirectModule],
  controllers: [HealthController],
})
export class AppModule {}