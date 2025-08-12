#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Find our local Linux Stockfish binary and make it executable
# This is the key command to fix the permission error.
chmod +x stockfish/stockfish-linux

echo "--- Build complete: Stockfish is now executable ---"