#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Make our local Linux Stockfish binary executable
chmod +x stockfish/stockfish-linux

# 2. Install Python dependencies
pip install -r requirements.txt