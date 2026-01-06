import { Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import type { ProductDTO } from './dtos/products.dto';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { StoredOwnerGuard } from 'src/users/user.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('product')
export class ProductController {
constructor(private ProductsService: ProductService){}

@UseGuards(AuthGuard,StoredOwnerGuard)
@Post()
@UseInterceptors(
  FilesInterceptor('images', 5, {
    storage: memoryStorage(),
  }),
)
async createProduct(@Body() body: ProductDTO,
       @Req() req,
       @UploadedFiles() file: Express.Multer.File[]){
    return this.ProductsService.createProducts(body,req.user.id,file)
}

@Get()
async findAll(){
return this.ProductsService.getAll()
}

@Get("search")
async getSearch(
  @Query("search") search?: string,
  @Query("page") page = "1",
  @Query("limit") limit = "12"
) {
  return this.ProductsService.SearchProducts({
    search,
    page: Number(page),
    limit: Number(limit),
  });
}

@Get(':id')
async productById(@Param('id') id:string){
    return this.ProductsService.GetProductsById(id)
}

@Get(':id/reviews')
async GetReview(@Param('id') productId:string){
    return this.ProductsService.GetReview(productId)
}

@Delete(':id')
async deleteProducts(@Param('id') id:string){
    return this.ProductsService.deleteProduct(id)
}
}
