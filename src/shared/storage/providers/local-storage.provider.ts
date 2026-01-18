// src/shared/storage/providers/local-storage.provider.ts
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { IStorageProvider } from '../storage.interface';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadPath: string;

  constructor() {
    this.uploadPath = path.resolve(process.cwd(), 'uploads');
    this.ensureUploadsDirExists();
  }

  private async ensureUploadsDirExists() {
    if (!(await exists(this.uploadPath))) {
      await mkdir(this.uploadPath, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, subPath = ''): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, subPath, fileName);
    const dirPath = path.dirname(filePath);

    if (!(await exists(dirPath))) {
      await mkdir(dirPath, { recursive: true });
    }

    await writeFile(filePath, file.buffer);
    return path.join(subPath, fileName).replace(/\\/g, '/');
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadPath, filePath);
    if (await exists(fullPath)) {
      await unlink(fullPath);
    }
  }

  async getUrl(filePath: string): Promise<string> {
    return `/uploads/${filePath}`;
  }
}
