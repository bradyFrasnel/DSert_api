// src/employe/employe.module.ts

import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeController } from './employe.controller';
import { StorageModule } from 'src/shared/storage/storage.module';
import { ImageProcessorModule } from '../shared/utils/image-processor.module';

@Module({
  imports: [PrismaModule, StorageModule, ImageProcessorModule],
  providers: [EmployeService],
  controllers: [EmployeController],
  exports: [EmployeService],
})
export class EmployeModule {}
