export type MaterialType = 'PDF' | 'Excel' | 'Word' | 'Otro'

export interface MaterialProps {
	id: string;
	session_id: string;
	name: string;
	drive_url: string;
	type: MaterialType;
	created_at: Date;
}

export class MaterialEntity {
	private props: MaterialProps

	constructor(props: MaterialProps) {
		this.props = { ...props }
	}

	get id() { return this.props.id }
	get session_id() { return this.props.session_id }
	get name() { return this.props.name }
	get drive_url() { return this.props.drive_url }
	get type() { return this.props.type }
	get created_at() { return this.props.created_at }
}