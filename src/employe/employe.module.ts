// src/employe/employe.module.ts

import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeController } from './employe.controller';

@Module({
  imports: [PrismaModule],
  providers: [EmployeService],
  controllers: [EmployeController],
  exports: [EmployeService], // 3. Exportez le service pour qu'il soit utilisable par le AuthModule
})
export class EmployeModule {}