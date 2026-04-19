#!/bin/sh

# Set health port from PORT environment variable if available, otherwise use default
export MEMORYLOOM_HEALTH_PORT=${PORT:-${MEMORYLOOM_HEALTH_PORT:-8080}}

echo "Starting MemoryLoom server on port $MEMORYLOOM_HEALTH_PORT"

# Start the server
exec node server.js