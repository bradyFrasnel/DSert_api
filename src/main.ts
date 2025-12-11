import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Autoriser les requêtes depuis le frontend (configurable via FRONTEND_URL)
  app.enableCors({
  origin: ['http://localhost:3000', 'http://192.168.1.67:4000'],
  credentials: true,
});
  const port = Number(process.env.PORT?? 4001);
  await app.listen(port, '0.0.0.0');
  console.log(`le serveur API est en écoute sur http://0.0.0.0:${port}`);


  const config = new DocumentBuilder()
    .setTitle('API de l\'application D\'Sert')
    .setDescription('Cette application fait l\'objet de ma soutenance de L3')
    .setVersion('4.2')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
}
bootstrap();
