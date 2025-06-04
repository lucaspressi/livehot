install:
pip install -r requirements.txt
run-backend:
    poetry run python -m backend.main
run-frontend:
npm start --prefix frontend
