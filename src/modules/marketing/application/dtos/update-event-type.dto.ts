import { CreateEventTypeDto } from './create-event-type.dto';

export class UpdateEventTypeDto implements Partial<CreateEventTypeDto> {
  name?: string;
  display_order?: number;
}
