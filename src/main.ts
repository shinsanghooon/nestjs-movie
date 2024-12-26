import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as ffmpegProbe from 'ffprobe-static';
import * as ffmpegFluent from 'fluent-ffmpeg';
import { AppModule } from './app.module';

ffmpegFluent.setFfmpegPath(ffmpeg.path)
ffmpegFluent.setFfprobePath(ffmpegProbe.path)

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log'],
  });

  const config = new DocumentBuilder()
    .setTitle('넷플 네스트')
    .setDescription('무비무비')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(
    session({
      secret: 'secret',
    })
  )

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
