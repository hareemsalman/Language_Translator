"""
Automated Pytest Suite for CodeAlpha Language Translation Tool API
Author: Internship Submission for CodeAlpha AI
"""

import pytest
from app import app, MAX_CHARACTER_LIMIT


@pytest.fixture
def client():
    """Creates a Flask test client instance."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test that the /api/health endpoint returns expected status."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'CodeAlpha Language Translator API'
    assert data['max_char_limit'] == MAX_CHARACTER_LIMIT


def test_get_languages(client):
    """Test that /api/languages returns supported languages dictionary."""
    response = client.get('/api/languages')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'languages' in data
    assert 'English' in data['languages']
    assert data['languages']['English'] == 'en'
    assert 'Spanish' in data['languages']


def test_translate_valid(client):
    """Test translating text from English to Spanish."""
    payload = {
        'text': 'Hello world',
        'source_lang': 'en',
        'target_lang': 'es'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'hola' in data['translated_text'].lower()
    assert data['source_lang'] == 'en'
    assert data['target_lang'] == 'es'


def test_translate_auto_detect(client):
    """Test auto-detection of source language."""
    payload = {
        'text': 'Bonjour tout le monde',
        'source_lang': 'auto',
        'target_lang': 'en'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'hello' in data['translated_text'].lower() or 'good' in data['translated_text'].lower()
    assert data['source_lang'] == 'auto'


def test_translate_same_language(client):
    """Test translation when source and target languages are identical."""
    payload = {
        'text': 'Same text',
        'source_lang': 'en',
        'target_lang': 'en'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['translated_text'] == 'Same text'


def test_translate_empty_input(client):
    """Test input validation for empty text string."""
    payload = {
        'text': '   ',
        'source_lang': 'en',
        'target_lang': 'es'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'empty' in data['error'].lower()


def test_translate_char_limit_exceeded(client):
    """Test input validation for character limit excess (>5000 chars)."""
    long_text = 'a' * (MAX_CHARACTER_LIMIT + 10)
    payload = {
        'text': long_text,
        'source_lang': 'en',
        'target_lang': 'es'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'limit exceeded' in data['error'].lower()


def test_translate_invalid_target(client):
    """Test validation when target language is invalid or unsupported."""
    payload = {
        'text': 'Hello',
        'source_lang': 'en',
        'target_lang': 'invalid_code_999'
    }
    response = client.post('/api/translate', json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'not supported' in data['error'].lower()
