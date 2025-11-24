// src/employe/employe.module.ts

import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 2. Rendez le PrismaService disponible dans ce module
  providers: [EmployeService],
  exports: [EmployeService], // 3. Exportez le service pour qu'il soit utilisable par le AuthModule
})
export class EmployeModule {}