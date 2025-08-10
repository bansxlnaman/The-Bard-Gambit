 # This file is owned by Member A: The Chess & Systems Engineer
 import chess
 import chess.pgn
 import io

def get_moves_from_pgn(pgn_filepath: str) -> list:
    """
    Parses a PGN file and returns a list of dictionaries,
    each containing structured information about a move.
    """
    try:
        with open(pgn_filepath) as pgn_file:
            game = chess.pgn.read_game(pgn_file)
            if not game:
                print("Error: Could not read a valid game from the PGN file.")
                return []

            board = game.board()
            move_list = []
            move_number = 0

            for move in game.mainline_moves():
                # For white's move, increment the move number
                if board.turn == chess.WHITE:
                    move_number += 1

                move_info = {
                    'move_number': move_number,
                    'color': 'White' if board.turn == chess.WHITE else 'Black',
                    'move_san': board.san(move), # Standard Algebraic Notation
                    'fen_before': board.fen()   # Board state before the move
                }
                move_list.append(move_info)
                board.push(move)

            return move_list
            
    except FileNotFoundError:
        print(f"Error: The file '{pgn_filepath}' was not found.")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

def get_moves_from_pgn_text(pgn_text: str) -> list:
    """
    Parses a PGN string and returns a list of dictionaries,
    each containing structured information about a move.
    """
    try:
        if not isinstance(pgn_text, str) or not pgn_text.strip():
            return []

        # Ensure result token exists; improves parser acceptance of movetext-only input
        if not any(token in pgn_text for token in ["1-0", "0-1", "1/2-1/2", " *", "\n*"]):
            pgn_text = pgn_text.strip() + " *"

        string_io = io.StringIO(pgn_text)
        game = chess.pgn.read_game(string_io)
        if not game:
            return []

        board = game.board()
        move_list = []
        move_number = 0

        for move in game.mainline_moves():
            if board.turn == chess.WHITE:
                move_number += 1

            move_info = {
                'move_number': move_number,
                'color': 'White' if board.turn == chess.WHITE else 'Black',
                'move_san': board.san(move),
                'fen_before': board.fen()
            }
            move_list.append(move_info)
            board.push(move)

        return move_list
    except Exception as e:
        print(f"An unexpected error occurred while parsing PGN text: {e}")
        return []