import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { Readable } from 'stream';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

@Injectable()
export class ImageProcessorService {
  private readonly MAX_WIDTH = 1200;
  private readonly MAX_HEIGHT = 1200;
  private readonly QUALITY = 80;
  private readonly FORMAT: keyof sharp.FormatEnum = 'jpeg';

  async processImage(file: Express.Multer.File): Promise<ProcessedImage> {
    try {
      // Convertir le buffer en stream pour le traitement
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      // Vérifier si un redimensionnement est nécessaire
      const needsResize =
        metadata.width > this.MAX_WIDTH || metadata.height > this.MAX_HEIGHT;

      // Appliquer le redimensionnement si nécessaire
      if (needsResize) {
        image.resize({
          width: this.MAX_WIDTH,
          height: this.MAX_HEIGHT,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convertir en format cible avec qualité optimisée
      const processedBuffer = await image
        .toFormat(this.FORMAT, {
          quality: this.QUALITY,
          progressive: true,
          optimiseScans: true,
        })
        .toBuffer();

      const processedMetadata = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        width: processedMetadata.width,
        height: processedMetadata.height,
        size: processedBuffer.length,
        format: this.FORMAT,
      };
    } catch (error) {
      throw new Error(`Erreur lors du traitement de l'image: ${error.message}`);
    }
  }

  /**
   * Vérifie si le fichier est une image valide
   */
  async validateImage(file: Express.Multer.File): Promise<boolean> {
    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();
      return !!metadata.format;
    } catch (error) {
      return false;
    }
  }
}
