// src/files/files.module.ts
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { StorageModule } from '../shared/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [FilesController],
})
export class FilesModule {}
