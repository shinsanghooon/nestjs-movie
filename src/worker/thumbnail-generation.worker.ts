import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import * as ffmpegFluent from 'fluent-ffmpeg';
import { join } from "path";
import { cwd } from "process";


@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {

    async process(job: Job, token?: string): Promise<any> {
        const { videoPath, videoId } = job.data;

        console.log(`Transcoding video with Id: ${videoId}`);

        const outputDirectory = join(cwd(), 'public', 'thumbnail');
        const outputThumbnailPath = join(outputDirectory, `${videoId}.png`)

        ffmpegFluent(videoPath)
            .screenshots({
                count: 1,
                folder: outputDirectory,
                fileName: `${videoId}.png`, // <-- 여기서 filename 으로 표기
                size: '320x240'
            })
            .on('end', () => {
                console.log(`Complete thumbnail task. videoId: ${videoId}`)
            })
            .on('error', (error) => {
                console.log('error')
                console.log(error)
            })
        return 0;
    }

}