import { IsIn, IsString } from "class-validator";

export const Categories = [
  "roupas",
  "calcados",
  "ferramentas",
  "eletronicos",
  "acessorios",
  "esportes",
  "moveis",
  "livros",
];

export class CategoryDTO {
  @IsString()
  @IsIn(Categories)
  category: string;
}
