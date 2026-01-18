// src/files/files.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../shared/storage/storage.service';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const path = await this.storageService.upload(file, 'profiles');
    const url = await this.storageService.getUrl(path);
    return {
      url,
      path,
    };
  }

  @Get('profile/:filename')
  async getProfileImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // En production, utilisez le stockage cloud
    if (process.env.STORAGE_TYPE !== 'local') {
      const url = await this.storageService.getUrl(`profiles/${filename}`);
      return res.redirect(url);
    }

    // En local, servez le fichier directement
    const filePath = join(process.cwd(), 'uploads', 'profiles', filename);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Fichier non trouvé');
    }

    return res.sendFile(filePath);
  }
}
