import sys
import os
from flask import Flask, jsonify
from flask_cors import CORS
import json

# --- Path Setup ---
# This allows main.py to find and import files from the 'src' directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- Import the Gemini Engine ---
# Make sure you are importing the correct, new class
from src.narrative_engine import GeminiNarrativeEngine

# --- Flask App Setup ---
app = Flask(__name__)
# CORS allows your frontend (on a different "origin") to request data from this server
CORS(app) 

# --- Load Game Data ---
# Construct the correct path to your games file
GAMES_FILE_PATH = os.path.join(os.path.dirname(app.instance_path), 'games', 'game_data.json')

try:
    with open(GAMES_FILE_PATH, 'r') as f:
        games_data = {game['id']: game for game in json.load(f)}
except FileNotFoundError:
    print(f"FATAL ERROR: Could not find game data at {GAMES_FILE_PATH}")
    games_data = {}

# --- API Endpoint ---
@app.route('/narrate/<string:game_id>/<string:theme_name>', methods=['GET'])
def narrate_game_endpoint(game_id, theme_name):
    """
    API endpoint that generates a themed narrative for a specific game ID.
    Example URL: http://127.0.0.1:5000/narrate/opera_game/medieval_kingdom
    """
    if not games_data:
        return jsonify({"error": "Game data could not be loaded."}), 500

    game = games_data.get(game_id)
    if not game:
        return jsonify({"error": f"Game with ID '{game_id}' not found"}), 404
    
    try:
        # Initialize the engine with the theme from the URL
        engine = GeminiNarrativeEngine(theme_name=theme_name)
        
        # Generate the narrative using the engine
        narrative = engine.create_narrative(game['pgn'])
        
        if "error" in narrative:
            return jsonify(narrative), 400

        # Return the final story as a JSON response
        return jsonify(narrative)
        
    except Exception as e:
        # Catch potential errors during engine initialization or generation
        print(f"An error occurred: {e}")
        return jsonify({"error": "An internal error occurred on the server."}), 500

# --- Main Execution ---
if __name__ == '__main__':
    # Runs the server. Host='0.0.0.0' makes it accessible on your local network.
    # The server will automatically reload if you make changes to the code (debug=True).
    app.run(host='0.0.0.0', port=5001, debug=True)