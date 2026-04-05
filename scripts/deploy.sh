#!/bin/bash
set -e

cd "$(dirname "$0")/.."

FUNCTION_NAME="${1:-fotocog}"

rm -f fotocog.zip
bash scripts/build.sh

aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --no-cli-pager \
    --zip-file fileb://fotocog.zip

echo "Deployed to $FUNCTION_NAME"
