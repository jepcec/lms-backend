export class CreateSessionDto {
	module_id: string;
	title: string;
	description?: string;
	youtube_url: string;
	youtube_video_id?: string;
	duration_minutes: number;
	display_order?: number;
}