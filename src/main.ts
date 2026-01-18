import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  // Autoriser les requêtes depuis le frontend (configurable via FRONTEND_URL)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.1.67:4000'],
    credentials: true,
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  const port = Number(process.env.PORT ?? 4001);
  await app.listen(port, '0.0.0.0');
  console.log(`le serveur API est en écoute sur http://0.0.0.0:${port}`);

  const config = new DocumentBuilder()
    .setTitle("API de l'application D'Sert")
    .setDescription("Cette application fait l'objet de ma soutenance de L3")
    .setVersion('4.2')
    .addTag('auth', 'Authentification')
    .addTag('employes', 'Gestion des employés')
    .addTag('convocations', 'Gestion des convocations')
    .addTag('chat', 'Chat en temps réel')
    .addTag('departements', 'Gestion des départements')
    .addTag('files', 'Gestion des fichiers')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
}
bootstrap();
