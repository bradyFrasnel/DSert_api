import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider, StorageType } from '../storage.interface';

export class S3StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async upload(file: Express.Multer.File, path?: string): Promise<string> {
    const key = path ? `${path}/${file.originalname}` : file.originalname;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return key;
  }

  async delete(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    await this.s3Client.send(command);
  }

  async getUrl(filePath: string): Promise<string> {
    // Pour S3, nous pouvons générer une URL signée temporaire
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    // Retourne une promesse qui sera résolue avec l'URL signée
    // Note: Dans une application réelle, vous devriez gérer cette promise correctement
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
