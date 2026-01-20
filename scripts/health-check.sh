#!/bin/bash

# Configuration
URL="http://localhost:3000" # Change to production URL for remote check
HEALTH_ENDPOINT="$URL/api/health"
MAX_RETRIES=3
RETRY_DELAY=5

echo "🏥 Starting Health Check for $URL..."

check_endpoint() {
    response=$(curl --write-out "%{http_code}" --silent --output /dev/null "$1")
    if [ "$response" -eq 200 ]; then
        echo "✅ $1 is UP (Status: 200)"
        return 0
    else
        echo "❌ $1 is DOWN (Status: $response)"
        return 1
    fi
}

# Check API Health Endpoint
attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    if check_endpoint "$HEALTH_ENDPOINT"; then
        echo "🟢 System is Healthy!"
        exit 0
    fi
    
    echo "⚠️  Attempt $attempt failed. Retrying in $RETRY_DELAY seconds..."
    sleep $RETRY_DELAY
    attempt=$((attempt + 1))
done

echo "🔴 System check FAILED after $MAX_RETRIES attempts."
exit 1
