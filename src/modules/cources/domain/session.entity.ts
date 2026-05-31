export interface SessionProps {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  youtube_video_id: string;
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
  get youtube_url() {
    return this.props.youtube_url;
  }
  get youtube_video_id() {
    return this.props.youtube_video_id;
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
