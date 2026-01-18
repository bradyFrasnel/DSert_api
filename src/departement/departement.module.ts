import { Module } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { DepartementController } from './departement.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DepartementController],
  providers: [DepartementService],
})
export class DepartementModule {}
