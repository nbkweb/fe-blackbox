import sys
import os

# Add the base directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from application import create_app

app = create_app()
