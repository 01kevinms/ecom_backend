import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  AddressDTO,
  CartItemDTO,
  CreateStoreDto,
  OrderDTO,
  UpdateAddressDTO,
} from './dto/user.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateReviewDTO } from 'src/products/dtos/products.dto';
import { StoredOwnerGuard } from './user.guard';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // =========================
  // 👤 PROFILE USER
  // =========================
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.GetUsers(req.user.id);
  }

    @Post('store')
  async createStore(@Req() req, @Body() data:CreateStoreDto ){
    return this.userService.CreateStore(req.user.id,data)
  }

  @UseGuards(AuthGuard,StoredOwnerGuard)

  @Get('store/historical')
  async getHistoricalStore(@Req() req){
return this.userService.getHistoricalStore(req.store.id)
  }

  // =========================
  // 🧺 CART
  // =========================
  @Get('cart')
  getCart(@Request() req) {
    return this.userService.GetCart(req.user.id);
  }

  @Put('cart')
  updateCart(
    @Request() req,
    @Body() data: CartItemDTO,
  ) {
    return this.userService.UpdadeCart(req.user.id, data);
  }

  @Delete('cart/item/:itemId')
  deleteCartItem(@Param('itemId') itemId: string) {
    return this.userService.DeleteItemCart(itemId);
  }

  // =========================
  // 🏠 ADDRESS
  // =========================
  @Post('address')
  createAddress(
    @Request() req,
    @Body() body: AddressDTO,
  ) {
    return this.userService.CreateAddress(body, req.user.id);
  }

  @Put('address/:addressId')
  updateAddress(
    @Param('addressId') addressId: string,
    @Body() data: UpdateAddressDTO,
    @Request() req,
  ) {
    return this.userService.UpdateAddress(
      addressId,
      req.user.id,
      data,
    );
  }

  // =========================
  // 🧾 CHECKOUT
  // =========================
  @Post('checkout')
  checkout(
    @Request() req,
    @Body() data: OrderDTO,
  ) {
    return this.userService.CheckoutItem(req.user.id, data);
  }

  // =========================
  // 📦 ORDERS
  // =========================
  @Get('orders')
  getOrders(@Request() req) {
    return this.userService.GetHistoricalOrder(req.user.id);
  }

  @Get('orders/:orderId')
  getOrderById(
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.userService.GetOrderId(orderId, req.user.id);
  }

  @Put('orders/:orderId/cancel')
  cancelOrder(
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.userService.UpStatusOrder(orderId, req.user.id);
  }

  @Post('orders/:orderId/confirm')
  confirmDelivered(
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.userService.confirmDelivered(orderId, req.user.id);
  }

  @Delete('orders/:orderId')
  deleteOrder(
    @Param('orderId') orderId: string,
    @Request() req,
  ) {
    return this.userService.DeleteOrder(orderId, req.user.id);
  }

  // =========================
  // ⭐ REVIEWS
  // =========================
  @Post('orders/:orderId/products/:productId/review')
  createReview(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @Req() req,
    @Body() dto: CreateReviewDTO,
  ) {
    return this.userService.createReview(
      orderId,
      productId,
      req.user.id,
      dto,
    );
  }
}
