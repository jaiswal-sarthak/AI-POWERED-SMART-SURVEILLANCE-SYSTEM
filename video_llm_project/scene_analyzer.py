from ultralytics import YOLO
import os

model = YOLO("yolov8n.pt")

def analyze_frames(frame_folder):
    detections = []
    for file in sorted(os.listdir(frame_folder)):
        if file.endswith(".jpg"):
            result = model.predict(source=os.path.join(frame_folder, file), save=False)
            labels = result[0].names
            boxes = result[0].boxes.cls.tolist()
            objects = [labels[int(cls)] for cls in boxes]
            detections.append((file, list(set(objects))))
    return detections
