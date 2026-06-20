#!/bin/bash
#
# Helper script to run all tests cleanly.
# Usage:
#   1. export SUPABASE_SERVICE_KEY=your-key
#   2. export TEST_USER_EMAIL=your@email.com
#   3. [optional] export BASE_URL=http://localhost:5173
#   4. ./scripts/run-tests.sh
#

set -e

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ ERROR: SUPABASE_SERVICE_KEY is not set"
  echo ""
  echo "Get it from Supabase Dashboard → Project Settings → API → service_role (secret key)"
  echo "Then run:"
  echo "  export SUPABASE_SERVICE_KEY=eyJhbGc..."
  echo "  export TEST_USER_EMAIL=you@example.com"
  echo "  ./scripts/run-tests.sh"
  exit 1
fi

if [ -z "$TEST_USER_EMAIL" ]; then
  echo "❌ ERROR: TEST_USER_EMAIL is not set"
  echo "  export TEST_USER_EMAIL=you@example.com"
  exit 1
fi

BASE=${BASE_URL:-https://worldcup-companion-beta.vercel.app}

echo "=== Running Live Features Test ==="
echo "BASE: $BASE"
echo "User: $TEST_USER_EMAIL"
echo "BASE_URL env can be set for local (e.g. http://localhost:5173)"
echo ""

# Run the test and also save full output to a file you can easily share
BASE_URL="$BASE" node tests/phase8-live-features.mjs 2>&1 | tee /tmp/phase8-results.txt

echo ""
echo "✅ Full output saved to: /tmp/phase8-results.txt"
echo "You can copy it with:  cat /tmp/phase8-results.txt | pbcopy   (on Mac)"
echo ""
echo "Please paste the entire output here so we can review failures one by one."
