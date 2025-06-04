# test_backend.py - Coloque este arquivo na pasta backend/

import os
import sys

print("🔍 Diagnóstico do Backend LiveHot")
print("=" * 50)

# Verificar estrutura de arquivos
print("\n📁 Estrutura de arquivos:")
for root, dirs, files in os.walk('.'):
    level = root.replace('.', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = ' ' * 2 * (level + 1)
    for file in files:
        if file.endswith(('.py', '.txt', '.json')):
            print(f"{subindent}{file}")

# Verificar imports necessários
print("\n📦 Verificando dependências:")
try:
    import flask
    print("✅ Flask instalado:", flask.__version__)
except ImportError:
    print("❌ Flask NÃO instalado - execute: pip install flask")

try:
    import flask_cors
    print("✅ Flask-CORS instalado")
except ImportError:
    print("❌ Flask-CORS NÃO instalado - execute: pip install flask-cors")

try:
    import jwt
    print("✅ PyJWT instalado")
except ImportError:
    print("❌ PyJWT NÃO instalado - execute: pip install pyjwt")

try:
    from PIL import Image
    print("✅ Pillow instalado")
except ImportError:
    print("❌ Pillow NÃO instalado - execute: pip install pillow")

try:
    from dotenv import load_dotenv
    print("✅ python-dotenv instalado")
except ImportError:
    print("❌ python-dotenv NÃO instalado - execute: pip install python-dotenv")

# Verificar arquivos principais
print("\n🔍 Procurando arquivo principal:")
main_files = []

if os.path.exists('main.py'):
    main_files.append('main.py')
    print("✅ Encontrado: main.py")

if os.path.exists('app/main.py'):
    main_files.append('app/main.py')
    print("✅ Encontrado: app/main.py")

if os.path.exists('app.py'):
    main_files.append('app.py')
    print("✅ Encontrado: app.py")

if not main_files:
    print("❌ Nenhum arquivo principal encontrado")
else:
    print(f"\n💡 Para executar, use um destes comandos:")
    for file in main_files:
        if '/' in file:
            print(f"   python -m {file.replace('/', '.').replace('.py', '')}")
        else:
            print(f"   python {file}")

print("\n🚀 Comandos para instalar dependências:")
print("pip install flask flask-cors pyjwt pillow python-dotenv")

print("\n" + "=" * 50)