import { IsString, MinLength } from "class-validator"

export interface SignUpDTO{
    name:string
    email:string
    password:string
}
export interface SingInDTO{
    password:string
    email:string
}

export class UpdatePassword{
@IsString()
currentPassword: string;

@IsString()
@MinLength(6)
  newPassword: string;
}