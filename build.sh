#!/usr/bin/env bash
# Exit on error
set -o errexit

# This script's only job is to install system packages.
# Nixpacks will handle the Python packages automatically.
echo "--- Installing system dependencies (Stockfish) ---"
apt-get update && apt-get install -y stockfish
echo "--- System dependencies installed ---"