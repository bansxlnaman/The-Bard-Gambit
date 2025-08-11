# The Bard's Gambit ♟️✍️

**The Bard's Gambit** is an AI-powered chess storytelling application that transforms standard chess games into epic, themed narratives.  
Instead of just seeing moves on a board, users can experience classic games like *"The Opera Game"* retold as a **medieval battle**, a **cosmic war**, a **noir detective story**, and more.

---

## Features

- **AI-Powered Storytelling** – Leverages Google's Gemini API to generate unique, high-quality narratives for entire chess games in a single request.
- **Thematic Narration** – Choose from multiple themes like *Medieval Kingdom*, *Cosmic Battle*, or *Noir Detective* to change the story's tone and style.
- **Intelligent Analysis** – Uses the Stockfish chess engine to pre-analyze games, providing the AI with crucial context about blunders, mistakes, and brilliant moves.
- **Interactive Frontend** – A clean, modern UI allows users to select a game and theme, read the generated story, and step through the corresponding moves on a visual chessboard.
- **Efficient Backend** – Built with Flask, optimized to generate the entire story in a single API call to avoid rate-limiting issues.

---

## 📂 Project Structure
```bash
The-Bard-Gambit/
│
├── frontend
│ ├── images/
│ ├── index.html
│ ├── styles.css
│ └── script.js
│
├── games/ 
│ └── game_state.json
│
│── backend/ 
│ └── main.py
│
│── src/
│ ├── config.py
│ ├── narrative_engine.py 
│ └── prompts.json
│
├── requirements.txt
└── README.md

```


## Tech Stack

- **Backend:** Python + Flask  
- **Frontend:** HTML, CSS, [chessboard.js](https://chessboardjs.com/)  
- **AI Engine:** Google Gemini API  
- **Chess Analysis:** Stockfish  

---

## Setup & Installation

### **Prerequisites**
- Python 3.8+
- Stockfish Chess Engine
- Google Gemini API Key

---

### **1. Clone the Repository**
```bash
git clone https://github.com/bansxlnaman/The-Bard-Gambit.git
cd The-Bard-Gambit
```

### **2. Set Up the Backend**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
```bash
pip install -r requirements.txt
```
```bash
# src/config.py
KEY = "YOUR_GEMINI_API_KEY_HERE"
```
```bash
STOCKFISH_PATH = "/path/to/your/stockfish/executable"
```
### **3. Start the backend**
```bash
cd backend
python3 main.py
```

Navigate to the frontend directory and open the **index.html** file in your web browser.

You can now select a game and a theme and click "Tell The Story" to generate your first chess narrative!


## 📜 License
This project is licensed under the MIT License – see the LICENSE file for details.

## 🤝 Contributing
Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to change.

