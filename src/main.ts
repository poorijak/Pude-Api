import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { frontendOrigin } from './auth/auth.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ origin: frontendOrigin(), credentials: true });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Pude API')
    .setDescription(
      'API documentation for Pude speech rehabilitation platform with Scalar UI',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Bearer token',
        in: 'header',
      },
      'bearer',
    )
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'HTTP-only session access token cookie',
      },
      'accessToken',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only refresh token cookie',
      },
      'refreshToken',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use('/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(document);
  });

  const scalarMiddleware = apiReference({
    theme: 'purple',
    pageTitle: 'Pude API Reference',
    spec: {
      content: document,
    },
  });

  app.use('/docs', scalarMiddleware);
  app.use('/reference', scalarMiddleware);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Scalar API Reference available at: http://localhost:${port}/docs`,
  );
}
void bootstrap();
