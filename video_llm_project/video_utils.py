import cv2
import os
from moviepy.editor import VideoFileClip

def extract_audio(video_path, audio_path):
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(audio_path)

def extract_frames(video_path, output_folder, frame_rate=1):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    cap = cv2.VideoCapture(video_path)
    count = 0
    frame_id = 0
    success, frame = cap.read()

    while success:
        if count % int(cap.get(cv2.CAP_PROP_FPS) / frame_rate) == 0:
            cv2.imwrite(os.path.join(output_folder, f"frame_{frame_id}.jpg"), frame)
            frame_id += 1
        success, frame = cap.read()
        count += 1

    cap.release()
