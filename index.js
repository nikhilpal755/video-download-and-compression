import express from 'express';
import ytdl from 'ytdl-core';
import fs from 'fs'
import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process';

const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
// FfM3VPj7a9o
app.get('/downloadYoutubeVideo', async (req, res) => {
  try {
    // const videoId = req.query.v;
    const videoId = 'FfM3VPj7a9o';
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoInfo = await ytdl.getInfo(videoUrl);
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });
    const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestvideo' });

    const audioFilePath = 'audio.mp4';
    const videoFilePath = 'video.mp4';
    const mergedFilePath = 'merged.mp4';

    const audioWriteStream = fs.createWriteStream(audioFilePath);
    ytdl(videoUrl, { format: audioFormat })
      .pipe(audioWriteStream);

    const videoWriteStream = fs.createWriteStream(videoFilePath);
    ytdl(videoUrl, { format: videoFormat })
      .pipe(videoWriteStream);

    audioWriteStream.on('finish', () => {
      const command = `${ffmpeg} -i ${videoFilePath} -i ${audioFilePath} -c:v copy -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 ${mergedFilePath}`;

      const ffmpegProcess = spawn(command, { shell: true });
      ffmpegProcess.on('error', (err) => {
        console.error('Video merging error:', err);
        res.status(500).send(`Video merging error: ${err.message}`);
      });
      ffmpegProcess.on('exit', () => {
        console.log('Video merging complete');
        // res.status(200).sendFile(mergedFilePath, { root: __dirname });
      });
    });
  } catch (err) {
    console.error('Error downloading video:', err);
    res.status(500).send(`Error downloading video: ${err.message}`);
  }

});


app.get('/compressVideo', (req, res) => {
  try {
    const videoFilePath = 'merged.mp4';
    const compressedVideoFilePath = 'compressed.mp4';
    const command = `${ffmpeg} -i ${videoFilePath} -c:v libx264 -crf 28 -c:a aac -s 1280x720 -error-resilient 1 ${compressedVideoFilePath}`;

    const ffmpegProcess = spawn(command, { shell: true });
    ffmpegProcess.stderr.on('data', (data) => {
      console.error('ffmpeg error:', data.toString());
    });
    ffmpegProcess.on('error', (err) => {
      console.error('Video compression error:', err);
      res.status(500).send(`Video compression error: ${err.message}`);
    });
    ffmpegProcess.on('exit', () => {
      console.log('Video compression complete');
      // res.status(200).sendFile(compressedVideoFilePath, { root: __dirname });
    });
  } catch (err) {
    console.error('Error compressing video:', err);
    res.status(500).send(`Error compressing video: ${err.message}`);
  }
});