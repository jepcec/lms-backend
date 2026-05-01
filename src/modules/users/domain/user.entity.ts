// ============================================================================
// file: Entidad principal de usuario 
//
// ============================================================================

export type UserRole = 'estudiante' | 'soporte' | 'marketing' | 'admin'
export interface UserProps{
	id: string;
	fullName: string;
	email: string;
	phone: string;
	passwordHash: string;
	role: UserRole;
	
	// los demas campos
}

export class UserEntity{
	private props: UserProps

	constructor(props: UserProps){
		this.props = {
			...props
		}
	}

	// geters
	get id() {return this.props.id}
	get email() {return this.props.email}
	get role() {return this.props.role}
	get fullName() {return this.props.fullName}
	get passwordHash() {return this.props.passwordHash}


	// operaciones - logica - reglas de negocio

}
