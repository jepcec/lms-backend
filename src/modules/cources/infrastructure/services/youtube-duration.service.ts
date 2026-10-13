import { Injectable, Logger } from '@nestjs/common';

function parseIso8601DurationToMinutes(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const totalMinutes = hours * 60 + minutes + seconds / 60;

  return totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes)) : null;
}

@Injectable()
export class YoutubeDurationService {
  private readonly logger = new Logger(YoutubeDurationService.name);

  async getDurationMinutes(videoId: string): Promise<number | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || !videoId) return null;

    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(
          `YouTube API respondió ${response.status} para el video ${videoId}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        items?: { contentDetails?: { duration?: string } }[];
      };
      const iso = data.items?.[0]?.contentDetails?.duration;
      if (!iso) return null;

      return parseIso8601DurationToMinutes(iso);
    } catch (error) {
      this.logger.warn(
        `No se pudo obtener la duración del video ${videoId} desde YouTube: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
