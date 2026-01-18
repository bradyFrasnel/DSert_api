// src/shared/storage/storage.service.ts
import { Injectable } from '@nestjs/common';
import { IStorageProvider, StorageType } from './storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';

@Injectable()
export class StorageService {
  private storageProvider: IStorageProvider;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const storageType = (process.env.STORAGE_TYPE || 'local') as StorageType;

    switch (storageType) {
      case 's3':
        this.storageProvider = new S3StorageProvider();
        break;
      case 'local':
      default:
        this.storageProvider = new LocalStorageProvider();
        break;
    }
  }

  async upload(file: Express.Multer.File, path?: string): Promise<string> {
    return this.storageProvider.upload(file, path);
  }

  async delete(filePath: string): Promise<void> {
    return this.storageProvider.delete(filePath);
  }

  async getUrl(filePath: string): Promise<string> {
    return await this.storageProvider.getUrl(filePath);
  }
}
