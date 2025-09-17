import os
from flask import Flask, request, jsonify
import gradio as gr
from video_utils import extract_audio, extract_frames
from transcriber import transcribe
from scene_analyzer import analyze_frames
from chat_engine import ask_question

# Initialize Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "static/uploads"
app.config['FRAME_FOLDER'] = "static/frames"
app.config['AUDIO_PATH'] = "static/audio.wav"

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['FRAME_FOLDER'], exist_ok=True)

# Global variable to store processed data
processed_data = {}

@app.route("/upload", methods=["POST"])
def handle_upload():
    """Handle video upload and processing"""
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save video
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(video_path)

        # Process video
        extract_audio(video_path, app.config['AUDIO_PATH'])
        extract_frames(video_path, app.config['FRAME_FOLDER'])

        # Analyze content
        transcript = transcribe(app.config['AUDIO_PATH'])
        detections = analyze_frames(app.config['FRAME_FOLDER'])

        # Store results
        processed_data[video_path] = {
            "transcript": transcript,
            "detections": detections
        }

        return {
            "status": "success",
            "video_path": video_path,
            "transcript": transcript[:500] + "..." if len(transcript) > 500 else transcript,
            "detections": detections
        }

    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/ask", methods=["POST"])
def handle_question():
    """Handle questions about the video"""
    data = request.get_json()
    if not data or 'video_path' not in data or 'question' not in data:
        return {"error": "Missing video_path or question"}, 400

    video_path = data['video_path']
    if video_path not in processed_data:
        return {"error": "Video not processed yet"}, 404

    try:
        # Get answer using positional arguments
        # In handle_question() function:
        answer = ask_question(
            question=data['question'],
            transcript=processed_data[video_path]['transcript'],
            detections=processed_data[video_path]['detections']
        )
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e)}, 500

# Gradio Interface
def gradio_interface(video_path, question):
    """Gradio processing function"""
    with app.test_client() as client:
        # Upload and process video
        with open(video_path, 'rb') as f:
            upload_response = client.post(
                '/upload',
                data={'video': (f, os.path.basename(video_path))},
                content_type='multipart/form-data'
            )
        
        upload_data = upload_response.get_json()  # Changed from .json() to .get_json()
        
        if upload_response.status_code != 200:
            return f"Upload error: {upload_data.get('error', 'Unknown error')}"

        # Ask question
        ask_response = client.post(
            '/ask',
            json={
                'video_path': upload_data['video_path'],
                'question': question
            },
            content_type='application/json'
        )
        
        ask_data = ask_response.get_json()  # Changed from .json() to .get_json()
        
        if ask_response.status_code != 200:
            return f"Question error: {ask_data.get('error', 'Unknown error')}"
        
        return ask_data['answer']

# Create Gradio interface
with gr.Blocks(title="Video Analysis Chatbot") as demo:
    gr.Markdown("# 🎥 Video Analysis Chatbot")
    
    with gr.Row():
        with gr.Column():
            video_input = gr.Video(label="Upload Video")
            question_input = gr.Textbox(label="Your Question")
            submit_btn = gr.Button("Ask Question")
        with gr.Column():
            answer_output = gr.Textbox(label="Answer", interactive=False)
    
    submit_btn.click(
        fn=gradio_interface,
        inputs=[video_input, question_input],
        outputs=answer_output
    )

if __name__ == "__main__":
    import threading
    
    # Run Flask in a separate thread
    def run_flask():
        app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Run Gradio in main thread
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False
    )