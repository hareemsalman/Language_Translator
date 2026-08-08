 Language Translation Tool 🌐
[![Python Version](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Framework-Flask%203.0+-green?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A full-stack, responsive **Language Translation Tool** built Powered by Python (Flask) and `deep-translator` (Google Translate wrapper) on the backend, paired with a modern glassmorphic frontend utilizing the browser's native Web Speech API for Text-to-Speech (TTS) capabilities.

---

## 🌟 Key Features

- **🌐 130+ Supported Languages**: Translate text across a massive array of global languages with automatic language name formatting.
- **✨ Auto-Detect Source Language**: Detects input language dynamically without requiring manual language selection.
- **⚡ Zero API Cost**: Uses `deep-translator` (free Google Translate wrapper) with automatic fallback to `MyMemoryTranslator` to prevent downtime without requiring paid API keys.
- **🔊 Text-to-Speech (TTS)**: Built-in speech synthesis using the Web Speech API (`window.speechSynthesis`) to listen to translated text with native accent playback.
- **📋 One-Click Copy & Paste**: Quick copy translation to clipboard and paste text from clipboard with instant feedback toasts.
- **🔄 Language Swap**: Quickly swap source and target languages and text fields with a single click.
- **📊 Real-Time Character Counter**: Live character progress bar enforcing a 5,000-character limit with color-coded warnings.
- **🌗 Dark & Light Themes**: Glassmorphic UI design with dark and light mode toggle saved in user preferences.
- **🕒 Translation History**: Local Storage drawer to view, reload, or clear recent translations.
- **⌨️ Keyboard Shortcuts**: Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to translate instantly.

---

## 📸 Screenshots & Demo

> [!NOTE]
> Below are UI preview placeholders for the CodeAlpha Language Translation Tool application.

```
+-----------------------------------------------------------------------------------+
|  🌐 Language Translator               [API Online]   [History]   [Theme: Dark]   |
+-----------------------------------------------------------------------------------+
|  [✨ Auto-detect     v]             [ 🔄 Swap ]             [ Spanish       v]    |
+--------------------------------------------------+--------------------------------+
|  SOURCE TEXT                                     |  TRANSLATION [✨ English]      |
|  Hello, welcome to Language Translator           |  Hola, bienvenido a las        |
|                                                  |  prácticas de CodeAlpha AI.    |
|                                                  |                                |
|  [||||||||||||..........]   37/ 5000 chars       |  [ Copy ]  [ Listen 🔊 ]       |
+--------------------------------------------------+--------------------------------+
|                             [ ⚡ Translate Now ]  Ctrl + Enter                    |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+**
- **Flask**: Lightweight WSGI web application server
- **Flask-CORS**: Cross-Origin Resource Sharing handler
- **Deep-Translator**: Free wrapper for Google Translate & MyMemory engines
- **Pytest**: Automated unit testing framework

### Frontend
- **HTML5 & Vanilla JavaScript (ES6+)**: Asynchronous fetch API, Web Speech API, LocalStorage
- **Vanilla CSS3**: CSS Custom Properties, Glassmorphism backdrop filters, Flexbox/Grid, Responsive animations
- **FontAwesome & Google Fonts**: Outfit & Plus Jakarta Sans typography

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python 3.8+** installed on your system.
- Git (optional, for cloning).

### 1. Clone or Download Repository
```bash
git clone https://github.com/your-username/Language_Translator.git
cd Language_Translator
```

### 2. Set Up Virtual Environment (Recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

---

## 🖥️ Running the Application

Start the Flask server locally:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Running Automated Unit Tests

To run the automated `pytest` test suite:
```bash
pytest test_app.py -v
```

All tests cover:
- `/api/health` status checks
- `/api/languages` dictionary validation
- Single & auto-detect language translations
- Input validation (empty text, character limits, unsupported language codes)

---

## 📡 API Reference

### 1. Translate Text
- **Endpoint**: `POST /api/translate`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Hello world",
    "source_lang": "auto",
    "target_lang": "es"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "translated_text": "Hola Mundo",
    "source_lang": "auto",
    "detected_lang": "en",
    "detected_lang_name": "English",
    "target_lang": "es",
    "target_lang_name": "Spanish",
    "char_count": 11
  }
  ```

### 2. Get Supported Languages
- **Endpoint**: `GET /api/languages`
- **Response**:
  ```json
  {
    "success": true,
    "languages": {
      "English": "en",
      "Spanish": "es",
      "French": "fr"
    }
  }
  ```

---

## 📂 Project Structure

```
CodeAlpha_LanguageTranslator/
├── app.py                   # Flask API Server & Translation Controller
├── test_app.py              # Pytest Unit Test Suite
├── requirements.txt         # Project Dependencies
├── .env.example             # Environment Configuration Template
├── .env                     # Environment Variables (Ignored in Git)
├── .gitignore               # Git Ignore Configuration
├── LICENSE                  # MIT License
├── README.md                # Project Documentation
├── static/
│   ├── css/
│   │   └── style.css        # Custom Glassmorphism Stylesheet & Animations
│   └── js/
│       └── main.js          # Client-side Logic, Web Speech API & History
└── templates/
    └── index.html           # Main HTML5 User Interface Template
```

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<p align="center"> Crafted with ❤️ by Student Developer</p>
