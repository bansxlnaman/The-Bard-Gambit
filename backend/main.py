import sys
import os
from flask import Flask, jsonify, request
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
CORS(
    app,
    resources={r"/narrate/*": {"origins": "*"}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# --- Load Game Data ---
# Construct the correct path to your games file
GAMES_FILE_PATH = os.path.join(os.path.dirname(app.instance_path), 'games', 'game_data.json')

try:
    with open(GAMES_FILE_PATH, 'r') as f:
        games_data = {game['id']: game for game in json.load(f)}
except FileNotFoundError:
    print(f"FATAL ERROR: Could not find game data at {GAMES_FILE_PATH}")
    games_data = {}

# --- Helpers ---
def _load_games_list_from_disk():
    try:
        with open(GAMES_FILE_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except Exception:
        return []


def _persist_game_to_disk(game_obj):
    games_list = _load_games_list_from_disk()
    # Upsert by id
    existing_index = next((i for i, g in enumerate(games_list) if g.get('id') == game_obj.get('id')), None)
    if existing_index is not None:
        games_list[existing_index] = game_obj
    else:
        games_list.append(game_obj)

    with open(GAMES_FILE_PATH, 'w') as f:
        json.dump(games_list, f, indent=2)

    # Keep in-memory index in sync
    games_data[game_obj['id']] = game_obj


# --- API Endpoints ---
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


@app.route('/narrate/<string:game_id>/<string:theme_name>', methods=['POST'])
def narrate_and_persist_with_id(game_id, theme_name):
    """
    Accepts JSON payload with a PGN and optional metadata, persists under the provided
    game_id, then generates a story using the given theme.

    Request JSON shape:
    {
        "eventName": "User Game",
        "whitePlayer": "White",
        "blackPlayer": "Black",
        "pgn": "1. e4 e5 ..."  # required
    }
    """
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return jsonify({"error": "Invalid JSON payload."}), 400

    if not data or 'pgn' not in data or not data['pgn']:
        return jsonify({"error": "Field 'pgn' is required."}), 400

    pgn_text = (data['pgn'] or '').strip()
    if not pgn_text.endswith(('1-0', '0-1', '1/2-1/2', '*')):
        pgn_text = f"{pgn_text} *".strip()

    game_obj = {
        'id': game_id,
        'eventName': data.get('eventName') or 'User Game',
        'whitePlayer': data.get('whitePlayer') or 'White',
        'blackPlayer': data.get('blackPlayer') or 'Black',
        'pgn': pgn_text
    }

    try:
        _persist_game_to_disk(game_obj)
    except Exception as e:
        print(f"Failed to persist game: {e}")
        return jsonify({"error": "Failed to persist game data."}), 500

    try:
        engine = GeminiNarrativeEngine(theme_name=theme_name)
        narrative = engine.create_narrative(game_obj['pgn'])
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"An error occurred during narrative generation: {e}")
        return jsonify({"error": "An internal error occurred on the server."}), 500

    if 'error' in narrative:
        return jsonify(narrative), 400

    return jsonify(narrative)

@app.route('/narrate', methods=['POST'])
def narrate_from_pgn():
    """
    Accepts JSON payload containing a PGN and optional metadata, persists the game,
    generates a story using the selected theme, and returns the story.

    Request JSON shape:
    {
        "id": "current_game",          # optional, default: "current_game"
        "eventName": "User Game",      # optional
        "whitePlayer": "White",        # optional
        "blackPlayer": "Black",        # optional
        "pgn": "1. e4 e5 ...",         # required
        "theme_name": "medieval_kingdom" # optional, default: "medieval_kingdom"
    }
    """
    try:
        data = request.get_json(force=True, silent=False)
    except Exception:
        return jsonify({"error": "Invalid JSON payload."}), 400

    if not data or 'pgn' not in data or not data['pgn']:
        return jsonify({"error": "Field 'pgn' is required."}), 400

    game_id = data.get('id') or 'current_game'
    theme_name = data.get('theme_name') or 'medieval_kingdom'

    # Normalize PGN: ensure it ends with a result token so python-chess can parse
    pgn_text = (data['pgn'] or '').strip()
    if not pgn_text.endswith(('1-0', '0-1', '1/2-1/2', '*')):
        pgn_text = f"{pgn_text} *".strip()

    game_obj = {
        'id': game_id,
        'eventName': data.get('eventName') or 'User Game',
        'whitePlayer': data.get('whitePlayer') or 'White',
        'blackPlayer': data.get('blackPlayer') or 'Black',
        'pgn': pgn_text
    }

    # Persist to disk and update in-memory cache
    try:
        _persist_game_to_disk(game_obj)
    except Exception as e:
        print(f"Failed to persist game: {e}")
        return jsonify({"error": "Failed to persist game data."}), 500

    # Generate story
    try:
        engine = GeminiNarrativeEngine(theme_name=theme_name)
        narrative = engine.create_narrative(game_obj['pgn'])
    except ValueError as e:
        # Likely an invalid theme name
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"An error occurred during narrative generation: {e}")
        return jsonify({"error": "An internal error occurred on the server."}), 500

    if 'error' in narrative:
        return jsonify(narrative), 400

    return jsonify(narrative)

# --- Main Execution ---
if __name__ == '__main__':
    # Runs the server. Host='0.0.0.0' makes it accessible on your local network.
    # The server will automatically reload if you make changes to the code (debug=True).
    app.run(host='0.0.0.0', port=5001, debug=True)