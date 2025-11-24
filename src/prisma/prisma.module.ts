import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ESSENTIEL : permet aux autres modules d'utiliser PrismaService
})
export class PrismaModule {}
