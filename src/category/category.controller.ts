import {  Controller, Get, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
constructor(private Categoryservice: CategoryService){}
@Get()
async getCategory(@Query('name') name?: string) {
  if (name) {
    return this.Categoryservice.getCategory(name);
  }
  return this.Categoryservice.findAll();
}
@Get(':categories')
  async findProduct(@Query('category') category: string){
    return this.Categoryservice.findProduct(category)
  }


}
