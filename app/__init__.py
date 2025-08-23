from flask import Flask
from .models import db
from flask_login import LoginManager

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)

    # Register blueprints
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'  # Important for @login_required
    login_manager.init_app(app)

    from .models import Merchant
    @login_manager.user_loader
    def load_user(user_id):
        return Merchant.query.get(int(user_id))

    return app
