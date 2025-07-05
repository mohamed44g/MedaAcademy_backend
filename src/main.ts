import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guards';
import { RolesGuard } from './guards/auth.role.guards';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import helmet from 'helmet';
import { join, resolve } from 'path';
import * as express from 'express';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'fatal', 'debug', 'verbose'],
  });

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable security headers
  app.use(helmet());

  app.enableCors({
    origin: 'https://localhost:3001',
    credentials: true,
  });

  // Serve static files (for posters)
  const uploadsPath = resolve('uploads');
  if (!existsSync(uploadsPath)) {
  } else {
    app.use('/uploads', express.static(uploadsPath));
  }

  // Setup global guards
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  app.useGlobalGuards(
    new AuthGuard(jwtService, configService, reflector),
    new RolesGuard(reflector),
  );

  // Setup global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('MedA+ Academy API')
    .setDescription('API for MedA+ Academy medical courses platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000);
}
bootstrap();
