import os
from flask import Flask

# Define absolute paths for templates and static folders
template_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'templates')
static_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static')

# Create the Flask app with explicit folders
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# Import routes (make sure you have routes.py in the app folder)
from app import routes
