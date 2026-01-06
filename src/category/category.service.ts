import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Categories } from './dto/category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
    constructor (private prisma:PrismaService){}
    async getCategory(name:string){
        const category = Categories.find(
            (c)=> c.toLowerCase() === name.toLocaleLowerCase(),
        )
        if(!category){
            throw new NotFoundException('category not found')
        }
        return { category }
    }
    async findAll(){
        return Categories
    }
    async findProduct(category:string){
        const ProductsExist = await this.prisma.product.findMany({
            where:{category}
        })
        if(ProductsExist.length === 0){
            throw new BadRequestException('there are no products in this category')
        }
        return ProductsExist
    }
   
}
