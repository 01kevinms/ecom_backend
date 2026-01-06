import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddressDTO, CartItemDTO, CreateStoreDto, OrderDTO, OrderStatusDTO, UpdateAddressDTO } from './dto/user.dto';
import { CreateReviewDTO } from 'src/products/dtos/products.dto';
import slugify from 'slugify';


@Injectable()
export class UserService {
    constructor(private prisma:PrismaService){}
    private scheduleShipped(orderId: string) {
  setTimeout(async () => {
    try {
      await this.prisma.order.updateMany({
        where: {
          id: orderId,
          status: "PENDING", // proteção
        },
        data: {
          status: "SHIPPED",
          shippedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar pedido para SHIPPED:", error);
    }
  }, 10_000); // 10 segundos
    }


    async GetUsers(userId:string){
    return await this.prisma.user.findUnique({
    where:{id:userId},
    select:{
      id:true,
      name:true,
      email:true,         
      address:true,
      order:true,
      store:true        
    }
    })
    }

    async GetCart(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
    throw new NotFoundException('User not found');
    }

      const cart = await this.prisma.cart.findUnique({
      where: { userId: id },
      include: {
      items: {
      include: { product: {include:{images:true}} }
      }
      }
      });

    // Se não existe carrinho → cria um novo
    if (!cart) {
    return await this.prisma.cart.create({
    data: { userId: id },
    include: {
    items: {
      include: { product: true }
    }
    }
    });
    }

    // Retornar carrinho completo
    return cart;
    }

    async GetOrderId(orderId: string, userId: string) {
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          product: true,          
        },
      },
      address: true,
    },
  });

  if (!order) {
    throw new NotFoundException('Pedido não encontrado');
  }

  return order;
    }

    async getHistoricalStore(storeId:string){
      const items = await this.prisma.orderItem.findMany({
        where:{storeId},
        include:{
          order:{
            select:{
              id:true,
              status:true,
              createdAt:true,
            }
          },
          product:{
            select:{
              id:true,
              name:true
            }
          },
        },
        orderBy:{order:{createdAt:'desc'}}
      })

      const ProductsCreate = await this.prisma.product.findMany({
        where:{storedId:storeId},
        include:{store:{select:{id:true,name:true}},images:true}
       
      })

      const status = await this.prisma.orderItem.aggregate({
        where:{storeId},
        _sum:{
          quantity:true,
          price:true
        }
      })
      const revenue = items.reduce((total,item)=>total + item.quantity * item.price,0)
      const totalOrders = await this.prisma.orderItem.groupBy({
        by:['orderId'],
        where:{storeId}
      })
      const ordersCount= totalOrders.length

      return{
        items,
        status,
        revenue,
        ordersCount,
        ProductsCreate
      }
    }

    async GetHistoricalOrder(userId:string){
      const res= await this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include:{
          items:{
            include:{product:true}
          }
        }
      })
      return res

    }

    async confirmDelivered(orderId:string, userId:string){
   try {  const order = await this.prisma.order.findUnique({
        where:{id:orderId}
      })
      if (!order) {
    throw new NotFoundException("Pedido não encontrado");
  }

  if (order.userId !== userId) {
    throw new ForbiddenException("Pedido não pertence a você");
  }

  if (order.status !== OrderStatusDTO.SHIPPED) {
    throw new BadRequestException(
      "Pedido ainda não pode ser confirmado"
    );
  }

  return this.prisma.order.update({
    where:{id:orderId},
    data:{
      status:OrderStatusDTO.DELIVERED,
      deliveredAt: new Date()
    }
  })}catch(error){
 throw new BadRequestException("erro na confirmacao")
  }
   } 

   async CreateStore(userId:string,data:CreateStoreDto){
    const user = await this.prisma.user.findUnique({
      where:{id:userId},
      include:{store:true}
    })
    if(!user){
      throw new NotFoundException("usuario nao encontrado")
    }
    if(user.store){
      throw new ForbiddenException("voce ja possui uma loja")
    }
    const slug = slugify(data.name,{
      lower:true,
      strict:true
    })
    const store = await this.prisma.store.create({
      data:{
        ownerId:user.id,
        name: data.name,
        description:data.description,
        logo:data.logo,
        slug:slug,
      }
    })

    return store
   }
   
    async createReview(
      orderId: string,
      productId: string,
      userId: string,
      dto: CreateReviewDTO
    ) {
      // 1️⃣ Verifica pedido
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          status: "DELIVERED",
          items: {
            some: {
              productId,
            },
          },
        },
      });

      if (!order) {
        throw new ForbiddenException(
          "Você só pode avaliar produtos entregues"
        );
      }

      // 2️⃣ Evita review duplicada
      const alreadyReviewed = await this.prisma.review.findFirst({
        where: {
          orderId,
          productId,
          userId,
        },
      });

      if (alreadyReviewed) {
        throw new BadRequestException(
          "Produto já avaliado neste pedido"
        );
      }

      // 3️⃣ Cria review
      return this.prisma.review.create({
        data: {
          orderId,
          productId,
          userId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    }

    async CreateAddress(data: AddressDTO, userId:string){
    const user = await this.prisma.user.findUnique({where:{id:userId}})
    if(!user){
    throw new UnauthorizedException('please create count before')
    }

    if(data.isDefault){
    await this.prisma.address.updateMany({
        where:{ userId },
        data:{ isDefault: false},
    });
    }

    const AddressUser= await this.prisma.address.create({
    data:{    
        user: { connect:{id:userId}},
        country:data.country,
          zip: data.zip, 
          city: data.city,
          street: data.street,
          number: data.number,
          isDefault: data.isDefault
    }
    })   
    return AddressUser
    }

    async UpdadeCart(userId: string, data: CartItemDTO) {
    const product = await this.prisma.product.findUnique({
    where: { id: data.productId },
    });

    if (!product) throw new BadRequestException("Produto não encontrado.");

    // busca carrinho
    const cart = await this.prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
    });

    const existingItem = cart?.items.find(
    (item) => item.productId === data.productId
    );

    const currentQty = existingItem?.quantity || 0;
    const totalQty = currentQty + data.quantity;

    if (totalQty > product.stock) {
    throw new BadRequestException(
    `Quantidade máxima disponível: ${product.stock}. Você já tem ${currentQty} no carrinho.`
    );
    }

    // se não existe carrinho → cria
    if (!cart) {
    return this.prisma.cart.create({
    data: {
      userId,
      items: {
        create: {
          productId: data.productId,
          quantity: Math.min(data.quantity, product.stock),
        },
      },
    },
    include: { items: { include: { product: true } } },
    });
    }

    // upsert do item
    return this.prisma.cartItem.upsert({
    where: {
    cartId_productId: {
      cartId: cart.id,
      productId: data.productId,
    },
    },
    create: {
    cartId: cart.id,
    productId: data.productId,
    quantity: data.quantity,
    },
    update: {
    quantity: {
      increment: data.quantity,
    },
    },
    include: { product: true },
    });
    }

    async UpdateAddress(addressId:string, userId:string, data:UpdateAddressDTO){
    const exist = await this.prisma.address.findUnique({
    where:{ id:addressId }
    })
    if(!exist){
    throw new UnauthorizedException("Endereço não encontrado");
    }

    if(exist.userId !== userId){
    throw new UnauthorizedException()
    }
    if(data.isDefault){
    await this.prisma.address.updateMany({
    where:{userId},
    data:{isDefault:false}
    })
    }
    return await this.prisma.address.update({
    where: { id:addressId },
    data
    });

    }

    async UpStatusOrder(id:string,userId:string){
 const order = await this.prisma.order.findFirst({
  where:{id, userId}
 })
   if (!order) {
    throw new NotFoundException('Pedido não encontrado');
  }

  if (order.status !== 'PENDING') {
    throw new BadRequestException(
      'Este pedido não pode ser cancelado'
    );
  }
 return this.prisma.order.update({
    where: { id },
    data: { status: 'CANCELED' },
  });
    }

   async CheckoutItem(userId: string, data: OrderDTO) {
  if (!data.items || data.items.length === 0) {
    throw new BadRequestException("Itens inválidos");
  }

  // 1️⃣ Buscar produtos reais
  const products = await this.prisma.product.findMany({
    where: {
      id: {
        in: data.items.map(item => item.productId),
      },
    },
    include:{store:true}
  });

  if (products.length !== data.items.length) {
    throw new BadRequestException("Produto inválido");
  }

  // 2️⃣ Calcular total e congelar preço
  let total = 0;

  const orderItems = data.items.map(item => {
    const product = products.find(p => p.id === item.productId);

    if(!product){
      throw new BadRequestException("produto invalido")
    }

    if (item.quantity <= 0) {
      throw new BadRequestException("Quantidade inválida");
    }

    if(product.stock<item.quantity){
      throw new BadRequestException(`Estoque insuficiente para ${product.name}`)
    }

    if(!product.storedId){
      throw new BadRequestException(`Produto ${product.name} nao pertence a nenhuma loja`)
    }

    const price = product!.price;
    total += price * item.quantity;

    return {
      productId: product.id,
      storeId:product.storedId,
      quantity: item.quantity,
      price,
    };
  });

  // 3️⃣ Buscar endereço
  const address = await this.prisma.address.findFirst({
    where: {
      id: data.addressId,
      userId,
    },
  });

  if (!address) {
    throw new BadRequestException("Endereço inválido");
  }

  // 4️⃣ Criar pedido
  const order = await this.prisma.$transaction(async tx => {
    for(const item of orderItems){
      await tx.product.update({
        where:{id:item.productId},
        data:{stock:{decrement:item.quantity}}
      })
    }
    return tx.order.create({
      data: {
        userId,
        total,
        paymentMethod: data.paymentMethod,
        status: "PENDING",

        address: {
          create: {
            street: address.street,
            number: address.number,
            city: address.city,
            zip: address.zip,
            country: address.country,
          },
        },

        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        address: true,
      },
    });
  });

  // ⏱️ 5️⃣ AGENDAMENTO PARA SHIPPED (fora da transaction)
  this.scheduleShipped(order.id);

  return order;
  }

    async DeleteItemCart(id:string){
    const exists = await this.prisma.cartItem.findUnique({
        where:{id}
    })

    if(!exists){
        throw new BadRequestException('item dont exist in cart')
    }

    const deleteItem = await this.prisma.cartItem.delete({
        where:{id}
    })
    return deleteItem
    }

    async DeleteOrder(id: string, userId: string) {
  const order = await this.prisma.order.findFirst({
    where: { id, userId },
  });

  if (!order) {
    throw new NotFoundException('Pedido não encontrado');
  }

  if (!['PENDING', 'CANCELED'].includes(order.status)) {
    throw new ForbiddenException(
      'Pedido não pode ser removido',
    );
  }

  return this.prisma.$transaction([
    this.prisma.orderItem.deleteMany({
      where: { orderId: id },
    }),

    this.prisma.orderAddress.deleteMany({
      where: { orderId: id },
    }),

    this.prisma.order.delete({
      where: { id },
    }),
  ]);
}

}
