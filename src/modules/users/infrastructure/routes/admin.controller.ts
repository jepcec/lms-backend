import { Controller, Get, Query } from "@nestjs/common";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { ListUsuariosUseCase } from "../../application/use-cases/list-usuarios.use-case";
import { ListUsuariosDto } from "../../application/dtos/list-usuarios.dto";

@Controller("administracion")
@Roles("admin")
export class AdminController {
	constructor(
		private readonly listUsuarios: ListUsuariosUseCase,
	) {}

	@Get("usuarios")
	async listUsuariosHandler(@Query() params: ListUsuariosDto) {
		return this.listUsuarios.execute(params);
	}
}
