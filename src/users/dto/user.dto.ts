import { OrderStatus } from "@prisma/client"
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Matches, MaxLength } from "class-validator"

export class AddressDTO{
   @IsString()
   country: string

   @IsString()
   zip:     string

   @IsString()
   city:    string

   @IsString()
   street:  string

   @IsNumber()
   number:  string

   @IsBoolean()
   isDefault: boolean
}
export class UpdateAddressDTO {
  street?: string;
  number?: string;
  city?: string;
  zip?: string;
  country?: string;
  isDefault?: boolean;
}
export enum MethodPayment {
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}
export enum OrderStatusDTO {
  PENDING = "PENDING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  PAID ="PAID",
  CANCELED = "CANCELED"
}

// OrderDTO
export class OrderDTO {
  items: {
    storeId:string
    productId: string;
    quantity: number;
  }[];
  addressId: string;
  paymentMethod: MethodPayment;
  orderStatus: OrderStatus;
}

export class CartItemDTO{
   @IsString()
   productId:   string

   @IsNumber()
   quantity:   number
   
}
export interface UsersDTO{
   name: string
   email: string
   password:  string
   cart?:  CartItemDTO[]
   address?:  AddressDTO[]
}
export interface CartDTO{
   item?:      CartItemDTO[]
   quantity?:   number
   updatedAt?:  Date
} 

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
  
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: "Logo deve ser uma URL válida" })
  logo?: string;
}
export class UpdateStoreSlugDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(60)
  slug: string;
}
