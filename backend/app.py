from flask import Flask
from routes.peers import peers_bp
from routes.server import server_bp
from routes.wireguard import wireguard_bp
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    CORS(app, 
         resources={r"/*": {
             "origins": [
                 "http://192.168.43.30:5173",  
                 "http://localhost:5173",      
                 "http://127.0.0.1:5173"       
             ],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }})
    
    # Register blueprints
    app.register_blueprint(server_bp)
    app.register_blueprint(peers_bp)
    app.register_blueprint(wireguard_bp)
    
    return app