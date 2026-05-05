// ============================================================================
// file: Entidad principal de usuario 
//
// ============================================================================

export type UserRole = 'estudiante' | 'soporte' | 'marketing' | 'admin'
export interface UserProps{
	id: string;
	first_name: string;
	last_name: string;
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
	get first_name() {return this.props.first_name}
	get lastName() {return this.props.last_name}
	get passwordHash() {return this.props.passwordHash}
 

	// operaciones - logica - reglas de negocio

}
