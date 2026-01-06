import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    cors:{
      origin:['http://localhost:5173'],
      credentials: true,
      allowedHeaders:'Content-Type, Authorization',
      methods:'GET,POST,PUT,DELETE,OPTIONS',
    }
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
