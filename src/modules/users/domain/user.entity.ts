// ============================================================================
// file: Entidad principal de usuario 
//
// -- mejora con mapeo de campos mejor opcion para evitar repetir codigo
// USERMAPER
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

	email_verification_token?: string | null;
	password_reset_token?: string | null;
	email_verified: boolean | false;
	email_verified_at?: Date | null;
	password_reset_expires_at?: Date | null;

	country?: string | null;
	profile_photo_url?: string | null;
	status?: string;
	created_by?: string | null;
	created_at?: Date;
	updated_at?: Date;
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
	set passwordHash(newPassword: string) {this.props.passwordHash = newPassword}
	get phone() {return this.props.phone}

	get emailVerificationToken() {return this.props.email_verification_token ?? null}
	set emailVerificationToken(value: string | null) {this.props.email_verification_token = value}

	get passwordResetToken() {return this.props.password_reset_token?? null}
	set passwordResetToken(value: string | null) {this.props.password_reset_token = value}

	get passwordResetExpiresAt() {return this.props.password_reset_expires_at?? null}
	set passwordResetExpiresAt(value: Date | null) {this.props.password_reset_expires_at = value}

	get emailVerified() {return this.props.email_verified}
	set emailVerified(value: boolean) {this.props.email_verified = value}

	get emailVerifiedAt() {return this.props.email_verified_at?? null}
	set emailVerifiedAt(value: Date | null) {this.props.email_verified_at = value}

	get country() {return this.props.country ?? null}
	get profilePhotoUrl() {return this.props.profile_photo_url ?? null}
	get status() {return this.props.status ?? 'active'}
	get createdBy() {return this.props.created_by ?? null}
	get createdAt() {return this.props.created_at ?? new Date()}
	get updatedAt() {return this.props.updated_at ?? new Date()}

	// operaciones - logica - reglas de negocio

}
