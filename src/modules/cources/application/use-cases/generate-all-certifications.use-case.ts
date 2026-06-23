// Este use-case quedó obsoleto con la generación de PDFs bajo demanda.
// Se mantiene el archivo para no romper imports, pero no tiene controller que lo invoque.
import { Injectable } from '@nestjs/common';

@Injectable()
export class GenerateAllCertificationsUseCase {
  async execute(_courseId: string) {
    return { message: 'Los PDFs ahora se generan bajo demanda en el endpoint de descarga.' };
  }
}
