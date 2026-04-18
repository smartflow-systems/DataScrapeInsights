#!/usr/bin/env bash
# Git credential helper that supplies the SFS_PAT token from the environment.
# Git invokes credential helpers with an action argument: get | store | erase.
# We only need to respond to "get". For "store" and "erase" we silently exit.
action="${1:-get}"
if [ "$action" != "get" ]; then
  exit 0
fi

if [ -z "${SFS_PAT:-}" ]; then
  exit 0
fi

# Read the input key=value lines (host, protocol, etc.) and discard them.
while IFS= read -r line; do
  [ -z "$line" ] && break
done

printf 'username=%s\n' "${SFS_USERNAME:-x-access-token}"
printf 'password=%s\n' "$SFS_PAT"
