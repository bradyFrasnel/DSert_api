import { Module } from '@nestjs/common';
import { ConvocationService } from './convocation.service';
import { ConvocationController } from './convocation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeModule } from '../employe/employe.module'; // <-- Ajout de l'EmployeModule

@Module({
  imports: [PrismaModule, EmployeModule], // <-- Ajouté EmployeModule pour résoudre la dépendance
  controllers: [ConvocationController],
  providers: [ConvocationService],
  exports: [ConvocationService],
})
export class ConvocationModule {}