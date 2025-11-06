# app/app.py
from flask import Flask, render_template, request, jsonify
from vpn_manager import VPNManager
import os

app = Flask(__name__)
vpn_manager = VPNManager()

@app.route('/')
def index():
    clients = vpn_manager.list_clients()
    return render_template('index.html', clients=clients)

@app.route('/add-client', methods=['POST'])
def add_client():
    client_name = request.form.get('client_name')
    if not client_name:
        return jsonify({'error': 'Nom du client requis'}), 400
    
    try:
        config = vpn_manager.add_client(client_name)
        return jsonify({
            'success': True,
            'config': config,
            'message': f'Client {client_name} ajouté avec succès'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/remove-client', methods=['POST'])
def remove_client():
    client_name = request.form.get('client_name')
    if vpn_manager.remove_client(client_name):
        return jsonify({'success': True, 'message': f'Client {client_name} supprimé'})
    else:
        return jsonify({'error': 'Client non trouvé'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)