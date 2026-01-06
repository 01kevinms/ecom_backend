import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports: [
    JwtModule.register({
    global:true,
    secret: jwtConstants.secret,    
  })],
  controllers:[AuthController],
  providers: [AuthService, PrismaService,CloudinaryService]
})
export class AuthModule {}
