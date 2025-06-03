#!/bin/sh
set -e
: ${API_BASE_URL:=/api}
cat <<EOT > /usr/share/nginx/html/config.js
window.API_BASE_URL="${API_BASE_URL}";
EOT
exec "$@"
