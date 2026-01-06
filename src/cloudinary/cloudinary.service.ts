import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {

  // 📤 UPLOAD
  async uploadFile(file: Express.Multer.File): Promise<{
    url: string;
    publicId: string;
  }> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "products",
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new InternalServerErrorException("Erro ao fazer upload da imagem");
    }
  }

  // 🧹 DELETE UMA IMAGEM
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException(
        "Erro ao deletar imagem do Cloudinary"
      );
    }
  }

  // 🧹 DELETE MÚLTIPLAS IMAGENS
  async deleteMany(publicIds: string[]): Promise<void> {
    try {
      if (!publicIds.length) return;

      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      throw new InternalServerErrorException(
        "Erro ao deletar imagens do Cloudinary"
      );
    }
  }
}
