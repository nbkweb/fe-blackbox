from flask import Flask
from flask_wtf.csrf import CSRFProtect
from config import config

csrf = CSRFProtect()

def create_app(config_name='default'):
    app = Flask(
        __name__,
        template_folder='app/templates',
        static_folder='app/static'
    )
    
    app.config.from_object(config[config_name])
    csrf.init_app(app)

    # Register only frontend-related blueprints
    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
