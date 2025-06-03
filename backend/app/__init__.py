from flask import Flask
from .config.settings import Config
from .config.database import db


def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    db.init_app(app)

    # Register blueprints here
    from .routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api')

    return app

app = create_app()
