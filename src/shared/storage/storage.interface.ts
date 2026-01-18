// src/shared/storage/storage.interface.ts
export interface IStorageProvider {
  upload(file: Express.Multer.File, path?: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): Promise<string>;
}

export type StorageType = 'local' | 's3' | 'cloudinary';
