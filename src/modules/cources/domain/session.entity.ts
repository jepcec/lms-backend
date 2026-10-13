export type VideoProvider = 'youtube' | 'drive';

export interface SessionProps {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  video_provider: VideoProvider;
  youtube_url: string | null;
  youtube_video_id: string | null;
  drive_url: string | null;
  duration_minutes: number;
  display_order: number;
  created_at: Date;
}

export class SessionEntity {
  private props: SessionProps;

  constructor(props: SessionProps) {
    this.props = { ...props };
  }

  get id() {
    return this.props.id;
  }
  get module_id() {
    return this.props.module_id;
  }
  get title() {
    return this.props.title;
  }
  get description() {
    return this.props.description ?? null;
  }
  get video_provider() {
    return this.props.video_provider;
  }
  get youtube_url() {
    return this.props.youtube_url;
  }
  get youtube_video_id() {
    return this.props.youtube_video_id;
  }
  get drive_url() {
    return this.props.drive_url;
  }
  get duration_minutes() {
    return this.props.duration_minutes;
  }
  get display_order() {
    return this.props.display_order;
  }
  get created_at() {
    return this.props.created_at;
  }
}
