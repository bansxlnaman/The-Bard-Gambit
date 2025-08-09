# This file is owned by Member B: The AI & Narrative Engineer
import google.generativeai as genai
from . import config

# --- Configuration & Model Setup (no changes) ---
genai.configure(api_key=config.GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')


# --- NEW: Holistic Story Generation Function ---
def generate_holistic_story(structured_moves: list) -> str:
    """
    Takes a list of all game moves and generates a single, cohesive story
    with just one API call.
    """
    # 1. Format the entire game into a simple string for the AI.
    # We create a standard PGN-like move string, e.g., "1. e4 e5 2. Nf3 Nc6..."
    game_movetext = ""
    for move_data in structured_moves:
        if move_data['color'] == 'White':
            game_movetext += f"{move_data['move_number']}. {move_data['move_san']} "
        else:
            game_movetext += f"{move_data['move_san']} "

    # 2. Craft a powerful, holistic prompt.
    # This prompt instructs the AI to think like a true storyteller.
    prompt = f"""
    You are an epic fantasy storyteller and a master chess chronicler.
    Below is the full move list of a chess game.

    Your task is to write a compelling narrative of the entire battle from start to finish.
    **Do not describe every single move.** Instead, identify the most important, dramatic moments
    (like the opening clash, major captures, clever maneuvers, sacrifices, or the final checkmate)
    and build a cohesive story around them.

    Give the story a title. Set the scene, describe the flow of the battle, and give it a dramatic conclusion.
    Make it engaging and exciting.

    Here is the game's move text:
    {game_movetext}
    """

    # 3. Make a single API call for the entire story.
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"An error occurred while generating the holistic story: {e}")
        return "The grand library of sagas is closed today. The story could not be told."