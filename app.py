"""
CodeAlpha Language Translation Tool - Flask Backend API
Author: Internship Submission for CodeAlpha AI
"""

import os
import logging
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from deep_translator import GoogleTranslator, MyMemoryTranslator, single_detection

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Character Limit Constraint
MAX_CHARACTER_LIMIT = 5000

# Cache supported languages dictionary for fast response
try:
    RAW_LANGUAGES = GoogleTranslator().get_supported_languages(as_dict=True)
    # Format keys nicely (e.g., 'english' -> 'English', 'chinese (simplified)' -> 'Chinese (Simplified)')
    SUPPORTED_LANGUAGES = {
        name.title(): code for name, code in RAW_LANGUAGES.items()
    }
except Exception as e:
    logger.warning(f"Could not load dynamic language list: {e}. Falling back to default list.")
    SUPPORTED_LANGUAGES = {
        "English": "en", "Spanish": "es", "French": "fr", "German": "de",
        "Chinese (Simplified)": "zh-CN", "Chinese (Traditional)": "zh-TW",
        "Arabic": "ar", "Hindi": "hi", "Urdu": "ur", "Japanese": "ja",
        "Russian": "ru", "Portuguese": "pt", "Italian": "it", "Turkish": "tr",
        "Dutch": "nl", "Korean": "ko", "Bengali": "bn", "Persian": "fa"
    }

# Reverse lookup dictionary (code to formatted name)
CODE_TO_LANG_NAME = {v: k for k, v in SUPPORTED_LANGUAGES.items()}
CODE_TO_LANG_NAME["auto"] = "Auto-detect"


@app.route('/')
def home():
    """Renders the main translation application interface."""
    return render_template('index.html')


@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Returns the dictionary of supported languages."""
    return jsonify({
        "success": True,
        "languages": SUPPORTED_LANGUAGES
    })


@app.route('/api/translate', methods=['POST'])
def translate_text():
    """
    Translates input text from source language to target language.
    Body JSON:
    {
        "text": string,
        "source_lang": string (e.g., 'auto', 'en', 'es'),
        "target_lang": string (e.g., 'es', 'fr', 'de')
    }
    """
    try:
        data = request.get_json() or {}
        text = data.get('text', '').strip()
        source_lang = data.get('source_lang', 'auto').strip()
        target_lang = data.get('target_lang', 'es').strip()

        # Input Validation: Empty text check
        if not text:
            return jsonify({
                "success": False,
                "error": "Input text cannot be empty."
            }), 400

        # Input Validation: Character limit check
        if len(text) > MAX_CHARACTER_LIMIT:
            return jsonify({
                "success": False,
                "error": f"Character limit exceeded. Maximum allowed is {MAX_CHARACTER_LIMIT} characters."
            }), 400

        # Input Validation: Target language check
        valid_codes = list(SUPPORTED_LANGUAGES.values()) + ["auto"]
        if target_lang not in valid_codes:
            return jsonify({
                "success": False,
                "error": f"Target language '{target_lang}' is not supported."
            }), 400

        if source_lang not in valid_codes:
            source_lang = "auto"

        # Check for same language source and target
        if source_lang != "auto" and source_lang == target_lang:
            return jsonify({
                "success": True,
                "translated_text": text,
                "source_lang": source_lang,
                "detected_lang": source_lang,
                "detected_lang_name": CODE_TO_LANG_NAME.get(source_lang, source_lang),
                "target_lang": target_lang,
                "target_lang_name": CODE_TO_LANG_NAME.get(target_lang, target_lang),
                "char_count": len(text),
                "note": "Source and target languages are identical."
            })

        detected_lang_code = source_lang
        translated_text = ""

        # Language Detection for Auto
        if source_lang == "auto":
            try:
                # Attempt auto-detection via single_detection
                detected_lang_code = single_detection(text, api_key=os.getenv("DETECTOR_API_KEY", None))
            except Exception as det_err:
                logger.warning(f"Language detection fallback triggered: {det_err}")
                detected_lang_code = "auto"

        # Primary Translation Attempt (GoogleTranslator)
        try:
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated_text = translator.translate(text)
        except Exception as primary_err:
            logger.warning(f"Primary translator failed ({primary_err}). Trying fallback MyMemoryTranslator...")
            try:
                # Fallback Translation Attempt (MyMemoryTranslator)
                fallback_src = "en" if source_lang == "auto" else source_lang
                fallback_translator = MyMemoryTranslator(source=fallback_src, target=target_lang)
                translated_text = fallback_translator.translate(text)
            except Exception as fallback_err:
                logger.error(f"Fallback translator also failed: {fallback_err}")
                return jsonify({
                    "success": False,
                    "error": "Translation service is currently unavailable. Please check your network connection or try again later."
                }), 500

        detected_lang_name = CODE_TO_LANG_NAME.get(detected_lang_code, str(detected_lang_code).upper())
        target_lang_name = CODE_TO_LANG_NAME.get(target_lang, str(target_lang).upper())

        return jsonify({
            "success": True,
            "translated_text": translated_text,
            "source_lang": source_lang,
            "detected_lang": detected_lang_code,
            "detected_lang_name": detected_lang_name,
            "target_lang": target_lang,
            "target_lang_name": target_lang_name,
            "char_count": len(text)
        })

    except Exception as e:
        logger.exception("Unexpected error in /api/translate")
        return jsonify({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}"
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "service": "CodeAlpha Language Translator API",
        "version": "1.0.0",
        "max_char_limit": MAX_CHARACTER_LIMIT
    })


if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'

    print(f"🚀 CodeAlpha Language Translation Tool running at http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
