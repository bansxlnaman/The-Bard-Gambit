import chess
import chess.pgn
import json
import io
import os
import google.generativeai as genai
from stockfish import Stockfish

# --- Configuration ---
from .config import KEY 
STOCKFISH_PATH = "/Users/namanbansal/Developer/The Bard's Gambit/bards_gambit/stockfish_engine/stockfish-macos-m1-apple-silicon" # Adjust if your path is different
PROMPTS_PATH = "/Users/namanbansal/Developer/The Bard's Gambit/bards_gambit/src/prompts.json"

# Configure the API clients
genai.configure(api_key=KEY)

class GeminiNarrativeEngine:
    def __init__(self, theme_name="medieval_kingdom"):
        """Initializes the engine with a theme, Stockfish, and Gemini models."""
        self.stockfish = Stockfish(path=STOCKFISH_PATH, depth=15, parameters={"Threads": 2, "Hash": 512})
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        with open(PROMPTS_PATH, 'r') as f:
            prompts = json.load(f)
        
        self.prompt_template = prompts.get(theme_name, {}).get("master_prompt_story")
        if not self.prompt_template:
            raise ValueError(f"Prompt for theme '{theme_name}' not found.")

    def _analyze_game_with_stockfish(self, game):
        """Pre-processes the game with Stockfish to identify key events."""
        analysis_results = []
        board = game.board()
        
        for move in game.mainline_moves():
            move_san = board.san(move) # Get SAN before changing the board state
            turn = "White" if board.turn == chess.WHITE else "Black"
            event = "normal"
            
            try:
                self.stockfish.set_fen_position(board.fen())
                eval_before = self.stockfish.get_evaluation()
                board.push(move) # Make the move
                self.stockfish.set_fen_position(board.fen())
                eval_after = self.stockfish.get_evaluation()
                
                val_before = eval_before.get('value')
                val_after = eval_after.get('value')

                if val_before is not None and val_after is not None:
                    cp_loss = (val_before - val_after) if turn == 'White' else -(val_before - val_after)
                    if cp_loss >= 300: event = "blunder"
                    elif cp_loss >= 150: event = "mistake"
                    elif cp_loss <= -100: event = "brilliant"
                    elif cp_loss <= -50: event = "great_move"
                
                if event == "normal" and board.is_capture(move):
                    event = "capture"

            except Exception as e:
                print(f"Stockfish analysis failed for a move: {e}")
                event = "capture" if board.is_capture(move) else "normal"

            analysis_results.append({"move": move_san, "turn": turn, "event": event})
            
        return analysis_results

    def create_narrative(self, game_pgn_string):
        """Generates a single, cohesive story for the entire game."""
        pgn_stream = io.StringIO(game_pgn_string)
        game = chess.pgn.read_game(pgn_stream)
        if not game:
            return {"error": "Could not parse PGN."}

        # 1. Analyze with Stockfish to get key moments
        stockfish_analysis = self._analyze_game_with_stockfish(game)
        analysis_text = "\n".join([f"- Move {i+1} ({item['turn']}): {item['move']} is a {item['event']}." for i, item in enumerate(stockfish_analysis)])

        # 2. Assemble the final prompt for Gemini
        final_prompt = self.prompt_template.format(analysis=analysis_text, pgn=game_pgn_string)
        
        # 3. Call Gemini API to get a single block of text (the story)
        try:
            response = self.gemini_model.generate_content(final_prompt)
            story_text = response.text.strip()
            
            # 4. Return the story in the final desired format
            return {"story": story_text}

        except Exception as e:
            print(f"Error during Gemini API call: {e}")
            return {"error": "Failed to generate story from the AI."}