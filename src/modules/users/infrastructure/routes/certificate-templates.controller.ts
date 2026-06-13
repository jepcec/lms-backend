import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ListCertificateTemplatesUseCase } from '../../application/use-cases/list-certificate-templates.use-case';
import { GetCertificateTemplateUseCase } from '../../application/use-cases/get-certificate-template.use-case';
import { CreateCertificateTemplateUseCase } from '../../application/use-cases/create-certificate-template.use-case';
import { UpdateCertificateTemplateUseCase } from '../../application/use-cases/update-certificate-template.use-case';
import { ActivateCertificateTemplateUseCase } from '../../application/use-cases/activate-certificate-template.use-case';
import { DeleteCertificateTemplateUseCase } from '../../application/use-cases/delete-certificate-template.use-case';
import { CreateCertificateTemplateDto } from '../../application/dtos/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from '../../application/dtos/update-certificate-template.dto';

const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(
      new Error('Only image files are allowed (jpg, jpeg, png, webp)'),
      false,
    );
  }
  callback(null, true);
};

@Controller('certificate-templates')
@Roles('admin')
export class CertificateTemplatesController {
  constructor(
    private readonly listUseCase: ListCertificateTemplatesUseCase,
    private readonly getUseCase: GetCertificateTemplateUseCase,
    private readonly createUseCase: CreateCertificateTemplateUseCase,
    private readonly updateUseCase: UpdateCertificateTemplateUseCase,
    private readonly activateUseCase: ActivateCertificateTemplateUseCase,
    private readonly deleteUseCase: DeleteCertificateTemplateUseCase,
  ) {}

  @Get()
  list() {
    return this.listUseCase.execute();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.getUseCase.execute(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('background_image', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreateCertificateTemplateDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    image?: Express.Multer.File,
  ) {
    if (image) {
      dto.background_image = image;
    }
    return this.createUseCase.execute(dto);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('background_image', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCertificateTemplateDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    image?: Express.Multer.File,
  ) {
    if (image) {
      dto.background_image = image;
    }
    return this.updateUseCase.execute(id, dto);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.activateUseCase.execute(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteUseCase.execute(id);
  }
}
