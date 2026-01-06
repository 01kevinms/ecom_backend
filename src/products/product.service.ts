import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {ProductDTO } from './dtos/products.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';


@Injectable()
export class ProductService {
    constructor (private prisma: PrismaService, private readonly Cloudinary:CloudinaryService){}


    async getAll(){
      return await this.prisma.product.findMany({
        include:{images:true}
      })
    }
    
   async SearchProducts({
  search,
  page,
  limit,
}: {
  search?: string;
  page: number;
  limit: number;
}) {
  type MongoAggregateResult<T> = {
    cursor: {
      firstBatch: T[];
    };
  };

  const skip = (page - 1) * limit;
  const pipeline: any[] = [];

  /* 🔍 SEARCH (Atlas Search) */
  if (search) {
    pipeline.push({
      $search: {
        index: "default",
        compound: {
          should: [
            {
              autocomplete: {
                query: search,
                path: "name",
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 3 } },
              },
            },
            {
              text: {
                query: search,
                path: ["description", "category"],
                score: { boost: { value: 1 } },
              },
            },
          ],
        },
      },
    });

    pipeline.push({
      $addFields: {
        score: { $meta: "searchScore" },
      },
    });
  }

pipeline.push(
  {
    $lookup: {
      from: "ProductImage",
      localField: "_id",
      foreignField: "productId",
      as: "images",
    },
  },
  {
    $addFields: {
      images: {
        $sortArray: {
          input: "$images",
          sortBy: { isPrimary: -1 },
        },
      },
    },
  }
);


  /* 📦 SORT + PAGINAÇÃO */
  pipeline.push(
    {
      $sort: search
        ? { score: -1, soldCount: -1, createdAt: -1 }
        : { createdAt: -1 },
    },
    { $skip: skip },
    { $limit: limit }
  );

  /* 📦 QUERY PRINCIPAL */
  const result = (await this.prisma.$runCommandRaw({
    aggregate: "Product",
    pipeline,
    cursor: {},
  })) as MongoAggregateResult<any>;

  const products = result.cursor.firstBatch;

  /* 🔢 COUNT (pipeline separado e simples) */
  const countPipeline: any[] = [];

  if (search) {
    countPipeline.push({
      $search: {
        index: "default",
        text: {
          query: search,
          path: ["name", "description", "category"],
        },
      },
    });
  }

  countPipeline.push({ $count: "total" });

  const countResult = (await this.prisma.$runCommandRaw({
    aggregate: "Product",
    pipeline: countPipeline,
    cursor: {},
  })) as MongoAggregateResult<{ total: number }>;

  const total = countResult.cursor.firstBatch[0]?.total ?? 0;

  return {
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
   }

    async GetProductsById(id:string){
    return this.prisma.product.findUnique({
    where:{id},
    include:{images:true}
    })
    }

    async GetReview(productId:string){
          const result = await this.prisma.review.aggregate({
        where:{productId},
        _avg:{
          rating:true
        },
        _count:{
          rating:true
        }
      })
      const review = await this.prisma.review.findMany({
  where:{productId},
  include:{
    user:{
      select:{name:true}
    }
  },
  orderBy:{ createdAt: "desc"}
})
      return{
        review,
        average: result._avg.rating ?? 0,
        totalReview: result._count.rating
      }
    }

    async createProducts (data: ProductDTO,userId:string,files:Express.Multer.File[]){
      const user = await this.prisma.user.findUnique({
        where:{id:userId},
        include:{store:true}
      })
      if(!user?.store){
        throw new ForbiddenException("Você não possui uma loja")
      }    

      const normalizedCategory = data.category.toLowerCase();

      const product = await this.prisma.product.create({
            data:{
                name: data.name,
                description: data.description,
                category: normalizedCategory,
                price: Number(data.price),
                stock: Number(data.stock),               
                storedId: user.store.id
            }
        })
      
     // 2️⃣ upload das imagens
  if (files?.length) {
  const uploads = await Promise.all(
  files.map(file => this.Cloudinary.uploadFile(file))
);

await this.prisma.productImage.createMany({
  data: uploads.map((img, index) => ({
    productId: product.id,
    url: img.url,
    publicId: img.publicId,
    isPrimary: index === 0,
  })),
});

  }
       
    return product
    }

   async deleteProduct(productId: string) {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product) {
    throw new NotFoundException("Produto não encontrado");
  }

  // 🔥 Deleta imagens do Cloudinary
  const publicIds = product.images.map(img => img.publicId).filter((id): id is string => id !== null);
  await this.Cloudinary.deleteMany(publicIds);

  // 🧹 Deleta imagens do banco
  await this.prisma.productImage.deleteMany({
    where: { productId },
  });

  // 🧹 Deleta produto
  await this.prisma.product.delete({
    where: { id: productId },
  });

  return { message: "Produto removido com sucesso" };
}

}
