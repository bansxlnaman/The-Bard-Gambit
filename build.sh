#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install system packages like Stockfish
apt-get update && apt-get install -y stockfish

# 2. Install Python dependencies
pip install -r requirements.txt