import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { Link } from './entities/link.entity.js';
import { LinksService } from './links.service.js';

export type LinkResponse = Link & { shortUrl: string };

// Base URL used to build the public shortUrl in responses. Kept simple
// (no ConfigModule) since Priority 1 intentionally avoids extra infra.
function getBaseUrl(): string {
  return process.env.BASE_URL ?? 'http://localhost:3000';
}

function toLinkResponse(link: Link): LinkResponse {
  return { ...link, shortUrl: `${getBaseUrl()}/${link.alias}` };
}

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLinkDto): Promise<LinkResponse> {
    const link = await this.linksService.create(dto);
    return toLinkResponse(link);
  }

  @Get()
  async findAll(): Promise<LinkResponse[]> {
    const links = await this.linksService.findAll();
    return links.map(toLinkResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LinkResponse> {
    const link = await this.linksService.findById(id);
    return toLinkResponse(link);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.linksService.delete(id);
  }
}