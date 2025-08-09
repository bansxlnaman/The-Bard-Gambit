# This is the main entry point for the application.
from src.chess_systems import get_moves_from_pgn
# **CHANGE HERE:** We now import the new holistic function
from src.narrative_engine import generate_holistic_story

def main():
    print("Bard's Gambit: The Holistic Chronicler v0.4")
    print("---------------------------------------------")

    pgn_file_path = "games/sample_game.pgn"

    # 1. Get structured move data (no change here)
    moves = get_moves_from_pgn(pgn_file_path)

    if not moves:
        print("Could not generate a story because no moves were found.")
        return

    # 2. Call the new function to create the single, cohesive story
    print(f"Generating holistic story for {pgn_file_path}...\n")
    # **CHANGE HERE:** Call the new function
    story = generate_holistic_story(moves)

    # 3. Print the final result
    print("--- The Saga Unfolds ---")
    print(story)
    print("------------------------")


if __name__ == "__main__":
    main()