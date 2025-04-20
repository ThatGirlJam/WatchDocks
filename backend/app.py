import os
import time
import base64
import json
import traceback
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from gtts import gTTS
import pygame

app = Flask(__name__)
CORS(app)
pygame.mixer.init()

# Configure Gemini API
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

def upload_to_gemini(path, mime_type=None):
    """Uploads the given file to Gemini.

    See https://ai.google.dev/gemini-api/docs/prompting_with_media
    """
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file

# Generation configuration
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 65536,
    "response_mime_type": "text/plain",
}

# Create the Gemini model
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-preview-04-17",
    generation_config=generation_config,
)

@app.route('/api/generate-warning', methods=['POST'])
def generate_warning():
    try:
        data = request.json
        image_base64 = data.get('imageData')
        camera_id = data.get('cameraId')

        print(f"Received camera: {camera_id}")
        print(f"Image data length: {len(image_base64) if image_base64 else 0}")

        # Decode and save the image
        timestamp = int(time.time())
        img_path = f"temp_frame_{timestamp}.jpg"
        with open(img_path, 'wb') as f:
            f.write(base64.b64decode(image_base64))
        print(f"Saved image to {img_path}")

        # Upload to Gemini
        gemini_file = upload_to_gemini(img_path, mime_type="image/jpeg")

        # Build prompt parts
        prompt_text = (
            "Generate ONLY a brief, direct security warning message (30-50 words max) to be announced over speakers "
            "to a person near the bike rack in this image. Mention their distinctive clothing. "
            "No analysis, no headers, no explanations - just the warning announcement itself. "
            "Make it clear they're being monitored by security cameras."
        )

        # Start a chat session with image + prompt
        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [gemini_file, prompt_text]
                }
            ]
        )
        response = chat_session.send_message("Analyze this image.")
        warning_message = response.text.strip()
        print(f"Gemini response: {warning_message}")

        # Generate TTS audio
        audio_file = f"warning_{timestamp}.mp3"
        tts = gTTS(text=warning_message, lang='en', slow=False)
        tts.save(audio_file)

        # Play the warning
        pygame.mixer.music.load(audio_file)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)

        return jsonify({
            "success": True,
            "message": warning_message,
            "audioFile": audio_file
        })

    except Exception as e:
        print(f"Error in generate_warning: {e}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
