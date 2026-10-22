import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`\n===================================================================`);
  console.log(`Loop Place Gadgets — Sales Analytics & Inventory Management System`);
  console.log(`PC Access:    http://localhost:${port}`);
  console.log(`Phone Access: http://192.168.254.120:${port}`);
  console.log(`===================================================================\n`);
}

bootstrap();
