from flask import Flask
from flask_wtf.csrf import CSRFProtect
from flask_login import LoginManager
from config import config
from app.models import db, Merchant

csrf = CSRFProtect()

def create_app(config_name='default'):
    app = Flask(
        __name__,
        template_folder='app/templates',
        static_folder='app/static'
    )
    
    app.config.from_object(config[config_name])
    csrf.init_app(app)
    db.init_app(app)

    # Setup Flask-Login
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return Merchant.query.get(int(user_id))

    # Register blueprints
    from app.routes import main as main_blueprint
    from app.auth import auth as auth_blueprint

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(main_blueprint)

    return app
