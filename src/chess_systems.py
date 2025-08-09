 # This file is owned by Member A: The Chess & Systems Engineer
import chess
import chess.pgn

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