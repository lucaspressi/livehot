#!/bin/sh
set -e

# Função para logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar se os arquivos necessários existem
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    log "ERROR: index.html not found in /usr/share/nginx/html/"
    exit 1
fi

# Substituir variáveis de ambiente nos arquivos JavaScript (se necessário)
if [ -n "$REACT_APP_API_URL" ]; then
    log "Setting REACT_APP_API_URL to $REACT_APP_API_URL"
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_API_URL_PLACEHOLDER|$REACT_APP_API_URL|g" {} \;
fi

# Verificar configuração do nginx
log "Testing nginx configuration..."
nginx -t

log "Starting nginx server..."

# Executar nginx
exec nginx -g "daemon off;"