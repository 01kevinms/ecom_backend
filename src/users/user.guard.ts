import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class StoredOwnerGuard implements CanActivate{
    constructor(private prisma:PrismaService){}

    async canActivate(context:ExecutionContext){
        const req = context.switchToHttp().getRequest()
        const userId= req.user.id

        const user = await this.prisma.user.findUnique({
            where:{id:userId},
            include:{store:true}
        })
        if(!user?.store){
            throw new ForbiddenException("voce nao possui uma loja")
        }
       
        req.store = user.store
        return true
    }
}