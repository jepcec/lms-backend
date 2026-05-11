export class UpdateSessionDto {
	title?: string;
	description?: string | null;
	youtube_url?: string;
	youtube_video_id?: string;
	duration_minutes?: number;
	display_order?: number;
}