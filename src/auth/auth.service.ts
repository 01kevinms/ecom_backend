import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'

import { SignUpDTO, SingInDTO, UpdatePassword } from './dtos/auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService, private jwtservice: JwtService,private readonly cloudinary:CloudinaryService){}
    
    async signup(data: SignUpDTO){
       const userExist= await this.prismaService.user.findUnique({
            where:{
                email: data.email
            }
        })
        if(userExist){
            throw new UnauthorizedException('user already exists')
        }
        const hashedPassword = await bcrypt.hash(data.password, 10)
        const user = await this.prismaService.user.create({
            data:{...data,
            password: hashedPassword
        }
        })

        
        return{
            id: user.id,
            email: user.email
        }
    }

    async Signin(data: SingInDTO){

        const user = await this.prismaService.user.findUnique({
            where: {email:data.email}})

            if(!user){
                throw new UnauthorizedException('Invalid credentials')
            }

        const passwordMatch = await bcrypt.compare(data.password, user.password)
         if(!passwordMatch){
                throw new UnauthorizedException('Invalid credentials')
            }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
        };
        const accessToken = this.jwtservice.sign(payload, {
    expiresIn: "15m",
  });

  const refreshToken = this.jwtservice.sign(payload, {
    expiresIn: "7d",
  });
        return{
            accessToken,
            refreshToken,            
        }
    }

    async refresh(refreshToken:string){
  try {
        const payload = await this.jwtservice.verifyAsync(refreshToken,{
            secret:jwtConstants.secret
        })
         const newAccessToken = this.jwtservice.sign(
      {
        id: payload.id,
        name: payload.name,
        email: payload.email,
      },
      { expiresIn: "15m" }
    )
    return { accessToken: newAccessToken}
    } catch  {
        throw new UnauthorizedException()
    }
    }

    async UpdateUser(id:string, data:SingInDTO){
        const userExist= await this.prismaService.user.findUnique({
            where:{id}
        })
       if(!userExist){
        throw new UnauthorizedException('user not found')
       }
       
       return await this.prismaService.user.update({
        data,
        where:{
            id
        }
       })
    }

    async UpdatePassword(userId:string,data: UpdatePassword){
      const user = await this.prismaService.user.findUnique({
            where: {id:userId}})

        if (!user) {
        throw new ForbiddenException("Usuário não encontrado");
        }

         const passwordMatch = await bcrypt.compare(
            data.currentPassword,
            user?.password
        )
        
        if(!passwordMatch){
            throw new BadRequestException()
        }

        const hashed = await bcrypt.hash(data.newPassword, 10)

        await this.prismaService.user.update({
            where:{id:userId},
            data:{
                password:hashed
            }
        })
         return { message: "Senha atualizada com sucesso" };
    }

    async DeleteUser(id: string) {
  const user = await this.prismaService.user.findUnique({
    where: { id },
    include: {
      store: {
        include: {
          products: {
            include: { images: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw new UnauthorizedException("User not exist");
  }

  /* 🔥 1️⃣ Deletar imagens do Cloudinary (FORA da transaction) */
  if (user.store) {
    const imagePublicIds =
      user.store.products.flatMap(p =>
        p.images.map(img => img.publicId)
      ).filter((id): id is string => id !== null) ?? [];

    if (imagePublicIds.length > 0) {
      await this.cloudinary.deleteMany(imagePublicIds);
    }

    // Logo da loja (se tiver)
    if (user.store.logoId) {
      await this.cloudinary.deleteFile(user.store.logoId);
    }
  }

  /* 🧹 2️⃣ Transaction só para BANCO */
  await this.prismaService.$transaction(async tx => {
    if (user.store) {
      const storeId = user.store.id;

      await tx.productImage.deleteMany({
        where: { product: { storedId: storeId } },
      });

      await tx.orderItem.deleteMany({
        where: { storeId },
      });

      await tx.product.deleteMany({
        where: { storedId: storeId },
      });

      await tx.store.delete({
        where: { id: storeId },
      });
    }

    // 🔥 Usuário SEMPRE deletado
    await tx.user.delete({
      where: { id },
    });
  });

  return { message: "Usuário e loja deletados com sucesso" };
}

    async allusers(){
        return await this.prismaService.user.findMany()
    }
}