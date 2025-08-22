from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from config import Config
import requests
import json

main = Blueprint('main', __name__)

@main.route('/')
def index():
    if 'auth_token' in session:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('main.login'))

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            if request.is_json:
                data = request.get_json()
                
                response = requests.post(
                    f"{Config.BACKEND_API_URL}/auth/login",
                    json=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get('requires_2fa'):
                        return jsonify({
                            'success': True,
                            'requires_2fa': True,
                            'temp_token': result.get('temp_token'),
                            'message': 'Please enter your 2FA code'
                        })
                    elif result.get('success'):
                        session['auth_token'] = result['token']
                        session['user_info'] = result['user']
                        
                        return jsonify({
                            'success': True,
                            'redirect': url_for('main.dashboard')
                        })
                    else:
                        return jsonify({
                            'success': False,
                            'error': result.get('error', 'Login failed')
                        })
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Authentication service unavailable'
                    }), 500
                    
        except requests.exceptions.RequestException:
            return jsonify({'success': False, 'error': 'Connection error'}), 500
        except Exception as e:
            return jsonify({'success': False, 'error': 'Unexpected error'}), 500
    
    return render_template('login.html')

@main.route('/verify-2fa', methods=['POST'])
def verify_2fa():
    try:
        data = request.get_json()
        
        response = requests.post(
            f"{Config.BACKEND_API_URL}/auth/verify-2fa",
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                session['auth_token'] = result['token']
                session['user_info'] = result['user']
                
                return jsonify({
                    'success': True,
                    'redirect': url_for('main.dashboard'),
                    'backup_code_used': result.get('backup_code_used', False)
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Invalid 2FA code')
                })
        else:
            return jsonify({
                'success': False,
                'error': 'Verification service unavailable'
            }), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': 'Verification failed'}), 500

@main.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('main.login'))

@main.route('/dashboard')
def dashboard():
    if 'auth_token' not in session:
        return redirect(url_for('main.login'))
    return render_template('dashboard.html', user_info=session.get('user_info'))

@main.route('/terminal')
def terminal():
    if 'auth_token' not in session:
        return redirect(url_for('main.login'))
    return render_template('terminal.html', user_info=session.get('user_info'))

@main.route('/transactions')
def transactions():
    if 'auth_token' not in session:
        return redirect(url_for('main.login'))
    return render_template('transactions.html', user_info=session.get('user_info'))

@main.route('/payouts')
def payouts():
    if 'auth_token' not in session:
        return redirect(url_for('main.login'))
    return render_template('payouts.html', user_info=session.get('user_info'))

@main.route('/settings')
def settings():
    if 'auth_token' not in session:
        return redirect(url_for('main.login'))
    return render_template('settings.html', user_info=session.get('user_info'))

@main.route('/api/proxy/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_proxy(endpoint):
    if 'auth_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        headers = {
            'Authorization': f"Bearer {session['auth_token']}",
            'Content-Type': 'application/json'
        }
        
        if request.method == 'GET':
            response = requests.get(
                f"{Config.BACKEND_API_URL}/{endpoint}",
                headers=headers,
                params=request.args,
                timeout=30
            )
        elif request.method == 'POST':
            response = requests.post(
                f"{Config.BACKEND_API_URL}/{endpoint}",
                headers=headers,
                json=request.get_json(),
                timeout=30
            )
        elif request.method == 'PUT':
            response = requests.put(
                f"{Config.BACKEND_API_URL}/{endpoint}",
                headers=headers,
                json=request.get_json(),
                timeout=30
            )
        elif request.method == 'DELETE':
            response = requests.delete(
                f"{Config.BACKEND_API_URL}/{endpoint}",
                headers=headers,
                timeout=30
            )
        
        return jsonify(response.json()), response.status_code
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Backend service unavailable'}), 503
    except Exception as e:
        return jsonify({'error': 'Proxy error'}), 500

@main.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

@main.errorhandler(500)
def internal_error(error):
    return render_template('errors/500.html'), 500
