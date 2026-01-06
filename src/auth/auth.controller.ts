import { Body, Controller, Delete, Get, Param, Post, Put, Req, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { SignUpDTO, SingInDTO, UpdatePassword } from './dtos/auth';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor (private authService: AuthService,private jwtservice: JwtService){}
 @Post ('signup')
 async signup(@Body() body: SignUpDTO){
    return this.authService.signup(body)
}

@Post('signin')
async signin(@Body() body: SingInDTO){
    return this.authService.Signin(body)
}

@Post('refresh')
async refresh(@Body('refreshToken') refreshToken:string){
  return this.authService.refresh(refreshToken)
}

@UseGuards(AuthGuard)
@Get('me')
async me (@Request() request){
    return request.user
}

@UseGuards(AuthGuard)
@Put("password")
async UpdatePassword(@Req() req, @Body() data:UpdatePassword){
    return this.authService.UpdatePassword(req.user.id,data)
}

@Put(':id')
async UpdateUser (@Param('id') id:string, @Body() data:SignUpDTO){
    return this.authService.UpdateUser(id,data)
}

@Delete(':id')
async DeleteUser(@Param('id') id:string){
return this.authService.DeleteUser(id)
}
}