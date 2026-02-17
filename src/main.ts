/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const serverAdapter = new ExpressAdapter();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  serverAdapter.setBasePath('/admin/queues');

  const addressQueue = app.get<Queue>(getQueueToken('address-queue'));

  createBullBoard({
    queues: [new BullMQAdapter(addressQueue)],
    serverAdapter,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  app.use('/admin/queues', serverAdapter.getRouter());

  // ---------------- START SERVER ----------------
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
