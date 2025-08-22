import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'frontend-secret-key-change-in-production'
    BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'https://black-rock-be.onrender.com/api/v1')
    BACKEND_SOCKET_URL = os.environ.get('BACKEND_SOCKET_URL', 'https://black-rock-be.onrender.com')
    SESSION_TIMEOUT = int(os.environ.get('SESSION_TIMEOUT', 3600))

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

class TestingConfig(Config):
    TESTING = True
    WTF_CSRF_ENABLED = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}