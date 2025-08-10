import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow frontend requests

# --- Path Setup ---
# Absolute path to the root of your project
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# games directory path
GAMES_DIR = os.path.join(PROJECT_ROOT, 'games')
# Final JSON file path
GAME_FILE_PATH = os.path.join(GAMES_DIR, 'game_data.json')

# Ensure games directory exists
if not os.path.exists(GAMES_DIR):
    os.makedirs(GAMES_DIR)

@app.route('/api/save_game', methods=['POST'])
def save_game_state():
    """
    Receives game state (FEN & PGN) from frontend and saves to file.
    """
    try:
        data = request.get_json()
        print("Received data from frontend:", data)  # Debug

        # Validate data
        if not data or 'fen' not in data or 'pgn' not in data:
            return jsonify({'status': 'error', 'message': 'Missing FEN or PGN'}), 400

        game_state = {
            'fen': data['fen'],
            'pgn_history': data['pgn']
        }

        # Save JSON to file
        with open(GAME_FILE_PATH, 'w') as f:
            json.dump(game_state, f, indent=4)

        print(f"Game state saved to: {GAME_FILE_PATH}")  # Debug
        return jsonify({'status': 'success', 'message': 'Game state saved successfully'})

    except Exception as e:
        print(f"Error while saving game state: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
