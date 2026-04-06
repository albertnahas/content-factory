#!/bin/bash
# Cost guard hook — warns before expensive generation operations
# Install as a PreToolUse hook for Bash commands

# Read stdin for hook context
INPUT=$(cat)

# Extract the command being run
COMMAND=$(echo "$INPUT" | jq -r '.toolUse.input.command // empty' 2>/dev/null)

# Check if it's a generation command that might be expensive
if echo "$COMMAND" | grep -qE '(replicate\.run|generateImage|generateVideo|generateTTS|generateMusic)'; then
  echo "Cost check: This operation will incur API costs. Verify the cost estimate before proceeding."
fi

exit 0
