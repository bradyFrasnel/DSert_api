import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Express } from 'express';
import type { Multer } from 'multer';
import { PieceJointeService } from './piece-jointe.service';
import { ManagerConvocationGuard } from '../convocation/guards/manager-convocation.guards';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('pieces-jointes')
@UseGuards(ManagerConvocationGuard)
export class PieceJointeController {
  constructor(private readonly pieceJointeService: PieceJointeService) {}

  @Post(':convocationId/upload')
  @UseInterceptors(FileInterceptor('fichier'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File & { originalname: string; mimetype: string; size: number },
    @Param('convocationId') convocationId: string,
    @GetUser('id') userId: string,
  ) {
    return this.pieceJointeService.uploadFile(file, convocationId, userId);
  }

  @Get(':id/download')
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment; filename="file"')
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, pieceJointe } = await this.pieceJointeService.downloadFile(id);
    
    res.set({
      'Content-Type': pieceJointe.typeMime,
      'Content-Disposition': `attachment; filename="${pieceJointe.nomFichier}"`,
      'Content-Length': pieceJointe.taille,
    });

    return new StreamableFile(stream);
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.pieceJointeService.deleteFile(id, userId);
  }

  @Get('convocation/:convocationId')
  async getByConvocation(
    @Param('convocationId') convocationId: string,
  ) {
    return this.pieceJointeService.getByConvocation(convocationId);
  }
}
