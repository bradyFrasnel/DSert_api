import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('DSERT API')
  .setDescription('API de gestion des convocations')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
