export interface ModuleProps {
	id: string;
	course_id: string;
	title: string;
	description?: string | null;
	display_order: number;
	created_at: Date;
}

export class ModuleEntity {
	private props: ModuleProps

	constructor(props: ModuleProps) {
		this.props = { ...props }
	}

	get id() { return this.props.id }
	get course_id() { return this.props.course_id }
	get title() { return this.props.title }
	get description() { return this.props.description ?? null }
	get display_order() { return this.props.display_order }
	get created_at() { return this.props.created_at }
}