import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import type { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---------------- SWAGGER ----------------
  const config = new DocumentBuilder()
    .setTitle('Address API')
    .setDescription('Consulta de CEP com cache')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ---------------- BULL BOARD ----------------

  const serverAdapter = new ExpressAdapter();

  serverAdapter.setBasePath('/admin/queues');

  const addressQueue = app.get<Queue>(getQueueToken('address-queue'));

  createBullBoard({
    queues: [new BullMQAdapter(addressQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  // ---------------- START SERVER ----------------
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
