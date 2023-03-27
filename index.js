import express from 'express';
import ytdl from 'ytdl-core';
import fs from 'fs'
import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process';

const app = express();
const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

app.get('/downloadYoutubeVideo', async (req, res) => {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=FfM3VPj7a9o';
    const videoInfo = await ytdl.getInfo(videoUrl);

    const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestvideo' });
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });

    const videoFile = fs.createWriteStream('video.mp4');
    ytdl(videoUrl, { format: videoFormat })
      .pipe(videoFile)
      .on('finish', () => {
        console.log('Video download complete');
        res.status(200).sendFile('video.mp4', { root: __dirname });
      })
      .on('error', (err) => {
        console.error('Video download error:', err);
        res.status(500).send(`Video download error: ${err.message}`);
      });
  } catch (err) {
    console.error('Error downloading video and audio:', err);
    res.status(500).send(`Error downloading video and audio: ${err.message}`);
  }
});


app.get('/compressVideo', (req, res) => {
  try {
    const videoFilePath = 'video.mp4';
    const compressedVideoFilePath = 'compressed.mp4';
    const command = `${ffmpeg} -i ${videoFilePath} -c:v libx264 -crf 28 -c:a aac -s 1280x720 -error-resilient 1 ${compressedVideoFilePath}`;

    const ffmpegProcess = spawn(command, { shell: true });
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