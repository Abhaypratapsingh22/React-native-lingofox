#!/usr/bin/env bash

# Execute a Clerk Backend API request with scope enforcement.
#
# Usage: bash execute-request.sh [--admin] <METHOD> <PATH> [BODY]
#
# Scope enforcement:
#   GET     — always allowed
#   POST, PUT, PATCH — requires CLERK_BAPI_SCOPES="write" or --admin flag
#   DELETE  — requires CLERK_BAPI_SCOPES="write,delete" or --admin flag

set -euo pipefail

# Walk up from $PWD to find .env/.env.local without executing their contents.
# Only the variables required by this script are imported.
_dir="$PWD"
while true; do
  for _envfile in "$_dir/.env" "$_dir/.env.local"; do
    if [[ -f "$_envfile" ]]; then
      while IFS= read -r _line || [[ -n "$_line" ]]; do
        [[ "$_line" =~ ^[[:space:]]*$ || "$_line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$_line" =~ ^[[:space:]]*(CLERK_SECRET_KEY|CLERK_BAPI_SCOPES)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
          _key="${BASH_REMATCH[1]}"
          _value="${BASH_REMATCH[2]}"
          _value="${_value#${_value%%[![:space:]]*}}"
          _value="${_value%${_value##*[![:space:]]}}"
          if [[ "$_value" == \"*\" && "$_value" == *\" ]]; then
            _value="${_value:1:${#_value}-2}"
          elif [[ "$_value" == $'\047'*$'\047' ]]; then
            _value="${_value:1:${#_value}-2}"
          fi
          if [[ "$_key" == "CLERK_SECRET_KEY" ]]; then
            if [[ -z "${CLERK_SECRET_KEY+x}" ]]; then
              export "CLERK_SECRET_KEY=$_value"
            fi
          elif [[ "$_key" == "CLERK_BAPI_SCOPES" ]]; then
            if [[ -z "${CLERK_BAPI_SCOPES+x}" ]]; then
              export "CLERK_BAPI_SCOPES=$_value"
            fi
          fi
        fi
      done < "$_envfile"
    fi
  done
  [[ -n "${CLERK_SECRET_KEY:-}" ]] && break
  _parent="$(dirname "$_dir")"
  [[ "$_parent" == "$_dir" ]] && break
  _dir="$_parent"
done
unset _dir _parent _envfile _line _key _value

# Parse --admin flag
ADMIN=false
if [[ "${1:-}" == "--admin" ]]; then
  ADMIN=true
  shift
fi

METHOD="${1:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
PATH_ARG="${2:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
BODY="${3:-}"

METHOD_UPPER=$(echo "$METHOD" | tr '[:lower:]' '[:upper:]')
SCOPES="${CLERK_BAPI_SCOPES:-}"

# Scope check
if [[ "$ADMIN" == false ]]; then
  case "$METHOD_UPPER" in
    GET)
      ;; # always allowed
    POST|PUT|PATCH)
      if [[ ",$SCOPES," != *,write,* ]]; then
        echo "ERROR: $METHOD_UPPER requests require CLERK_BAPI_SCOPES=\"write\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    DELETE)
      if [[ ",$SCOPES," != *,write,* ]] || [[ ",$SCOPES," != *,delete,* ]]; then
        echo "ERROR: DELETE requests require CLERK_BAPI_SCOPES=\"write,delete\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    *)
      echo "ERROR: Unknown HTTP method: $METHOD_UPPER" >&2
      exit 1
      ;;
  esac
fi

# Only the official Clerk API host may receive the secret key. Caller-provided
# overrides are accepted only when they use the exact approved HTTPS origin.
BASE_URL="${CLERK_REST_API_URL:-https://api.clerk.com}"
if [[ "$BASE_URL" != "https://api.clerk.com" ]]; then
  echo "ERROR: CLERK_REST_API_URL must be exactly https://api.clerk.com." >&2
  exit 1
fi

# Build curl command
CURL_ARGS=(
  -s
  --fail-with-body
  -X "$METHOD_UPPER"
  "${BASE_URL}/v1${PATH_ARG}"
  -H "Authorization: Bearer ${CLERK_SECRET_KEY:?CLERK_SECRET_KEY is not set}"
  -H "Content-Type: application/json"
)

if [[ -n "$BODY" ]]; then
  CURL_ARGS+=(-d "$BODY")
fi

curl "${CURL_ARGS[@]}"
