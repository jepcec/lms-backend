import { MaterialType } from "../../domain/material.entity";

export class CreateMaterialDto {
	session_id: string;
	name: string;
	drive_url: string;
	type: MaterialType;
}