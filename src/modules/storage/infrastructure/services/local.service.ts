import { Injectable } from "@nestjs/common";
import { extname, join } from "path";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { IFileStorageService } from "../../domain/file-storage.interface";
import { ImageTransformOptions, UploadFileOptions, UploadFileResult } from "../../domain/file-storage.types";

@Injectable()
export class LocalStorageService implements IFileStorageService {
  private readonly basePath = "./uploads";

  async upload(file: UploadFileOptions): Promise<UploadFileResult> {
    const folder = file.folder ?? "misc";
    const destDir = join(this.basePath, folder);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${extname(file.originalName)}`;
    const filePath = join(destDir, filename);

    writeFileSync(filePath, file.buffer);

    const url = `/uploads/${folder}/${filename}`;

    return {
      url,
      secureUrl: url,
      publicId: filename,
      mimetype: file.mimetype,
      originalName: file.originalName,
      size: file.buffer.length,
    };
  }

  getUrl(publicId: string, _options?: ImageTransformOptions): string {
    return `/uploads/${publicId}`;
  }

  async delete(publicId: string): Promise<void> {
    const filePath = join(this.basePath, publicId);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}
