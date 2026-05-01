// ===================================================
// contratado de operaciones para base de datos
//
// ===================================================

import { UserEntity } from "./user.entity";

export interface IUserRepository{

	findById(id: string): Promise<UserEntity | null>
	findByEmail(email: string): Promise<UserEntity | null>
	save(user: UserEntity): Promise<void>

}

export const I_USER_REPOSITORY = Symbol('IUserRepository')

