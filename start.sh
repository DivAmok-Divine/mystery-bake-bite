#!/bin/bash

# Mystery Bake Bites - Start Script
# This script starts the development server and ensures clean termination.

echo "🍩 Starting Mystery Bake Bites Development Server..."

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "👋 Stopping Mystery Bake Bites... Cleaning up processes."
    # Kill the dev server and any related processes
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# Start the Vite development server
npm run dev &

# Wait for background processes to finish
wait
