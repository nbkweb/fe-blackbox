import os
import sys

# Add debugging
print("=== DEBUGGING INFO ===")
print("Python path:", sys.path)
print("Current directory contents:", os.listdir('.'))
print("Environment:", os.getenv('FLASK_ENV', 'default'))

try:
    print("Attempting to import app module...")
    import app
    print("App module imported successfully")
    print("App module attributes:", [attr for attr in dir(app) if not attr.startswith('_')])
    
    print("Attempting to get create_app function...")
    create_app = getattr(app, 'create_app', None)
    if create_app:
        print("create_app function found!")
    else:
        print("ERROR: create_app function not found in app module")
        raise ImportError("create_app function not found")
        
except Exception as e:
    print(f"Error importing app module: {e}")
    import traceback
    traceback.print_exc()
    raise

try:
    print("Creating Flask app...")
    flask_app = create_app(os.getenv('FLASK_ENV', 'default'))
    print("Flask app created successfully")
except Exception as e:
    print(f"Error creating Flask app: {e}")
    import traceback
    traceback.print_exc()
    raise

# Assign to 'app' variable for gunicorn
app = flask_app

if __name__ == '__main__':
    app.run()
