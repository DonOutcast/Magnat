import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import { AccessGuard } from './guards/accesses.guard';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalGuards(new JwtAuthGuard(new JwtService()), new RolesGuard(new Reflector()), new AccessGuard(new Reflector()));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('MPSales Docs')
    .setDescription('Документация к MPSales')
    .setVersion('0.1.0')
    .addTag('@al_damask')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, doc);

  await app.listen(process.env.PORT);
}
bootstrap();
// TODO: 2. В пути до клиента Озон
// TODO: 5. В пути до клиента ВБ
// TODO: 4. Возврат от клиента ВБ
// TODO: 6. Возврат от клиента Озон
