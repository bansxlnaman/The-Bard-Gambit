# This is now your backend server
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from src.chess_systems import get_moves_from_pgn
from src.narrative_engine import generate_holistic_story

app = Flask(__name__)
# **IMPORTANT**: This enables your JavaScript to talk to your Python server
CORS(app) 

@app.route('/generate-story', methods=['POST'])
def handle_story_generation():
    # Get the PGN from the frontend's request
    data = request.json
    pgn_string = data.get('pgn')

    if not pgn_string:
        return jsonify({"error": "No PGN string provided"}), 400

    # We need a temporary way to pass a string to our existing function
    # In a real app, you might refactor get_moves_from_pgn to accept a string
    with open("temp_game.pgn", "w") as f:
        f.write(pgn_string)
    
    # 1. Get structured moves from the PGN
    moves = get_moves_from_pgn("temp_game.pgn")
    if not moves:
        return jsonify({"error": "Could not parse PGN"}), 400

    # 2. Generate the story
    story = generate_holistic_story(moves)

    # 3. Send the story back to the frontend
    return jsonify({"story": story})

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, port=5000)