from flask import Flask
from flask_wtf.csrf import CSRFProtect
from config import config

csrf = CSRFProtect()

def create_app(config_name='default'):
    # Point Flask to look for templates and static files in the app folder
    app = Flask(
        __name__,
        template_folder='app/templates',
        static_folder='app/static'
    )
    
    app.config.from_object(config[config_name])
    csrf.init_app(app)
    
    # Import from the app folder
    from app.routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    return app

