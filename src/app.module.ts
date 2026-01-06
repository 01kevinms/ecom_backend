import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthService } from './auth/auth.service';
import { ProductController } from './products/product.controller';
import { ProductService } from './products/product.service';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { UserController } from './users/user.controller';
import { UserService } from './users/user.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProductsModule } from './products/products.module';
import { MulterModule } from '@nestjs/platform-express';


@Module({
  imports:[MulterModule.register({limits:{fileSize:5 * 1024 * 1024}}),
    AuthModule, ScheduleModule.forRoot(), CloudinaryModule, ProductsModule, MulterModule],
  providers: [AuthService,PrismaService, ProductService, CategoryService, UserService, CloudinaryService],
  controllers: [ProductController, CategoryController, UserController],
})
export class AppModule {}
