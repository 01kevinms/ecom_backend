import { IsString, IsNumber, IsOptional, IsNotEmpty, IsArray, IsInt, Min, Max } from 'class-validator';

export class ProductDTO {
 
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  createdAt?: Date;
}

export class CreateReviewDTO {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment: string;
}


export const ProductImages = [
  {id: 9, name:"headphone",category:"eletronicos", url:"https://res.cloudinary.com/dudpqqgch/image/upload/v1765328959/image_9_plpqbb.png"},
  {id: 9, name:"sound",category:"eletronicos", url:"https://res.cloudinary.com/dudpqqgch/image/upload/v1765328960/image_16_ucj1wg.png"},
  {id: 9, name:"phone",category:"eletronicos", url: "https://res.cloudinary.com/dudpqqgch/image/upload/v1765328959/image_14_iemnhv.png"},
  {id: 9, name:"watch",category:"eletronicos", url:"https://res.cloudinary.com/dudpqqgch/image/upload/v1765328959/image_15_hy1ccg.png"},
  {id: 9, name:"martelo",category:"ferramentas", url:"https://res.cloudinary.com/dudpqqgch/image/upload/v1765385300/Gemini_Generated_Image_8l9asf8l9asf8l9a_rybrmz.png"},
  {id: 9, name:"parafusa",category:"ferramentas", url:"https://res.cloudinary.com/dudpqqgch/image/upload/v1765385300/Gemini_Generated_Image_8l9asf8l9asf8l9a_rybrmz.png"},
]