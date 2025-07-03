#!/bin/sh
# wait-for-postgres.sh - Enhanced version with better error handling

set -e

host="$1"
shift
user="$1"
shift
cmd="$@"

echo "🔍 Waiting for PostgreSQL at $host:5432 with user $user..."
echo "📝 Will execute: $cmd"

# Wait for PostgreSQL to be ready with timeout and retry logic
max_attempts=30
attempt=1

until pg_isready -h "$host" -p 5432 -U "$user" > /dev/null 2>&1; do
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ PostgreSQL failed to become ready after $max_attempts attempts"
    exit 1
  fi
  
  echo "⏳ Postgres is unavailable - attempt $attempt/$max_attempts, sleeping 2s..."
  sleep 2
  attempt=$((attempt + 1))
done

echo "✅ PostgreSQL is ready! Starting application..."
echo "🚀 Executing: $cmd"
exec $cmd 