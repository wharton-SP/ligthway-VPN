from flask import Flask, jsonify, request
import os
import base64
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import serialization

app = Flask(__name__)

WIREGUARD_PATH = "/wireguard-config"

@app.route("/")
def home():
    return jsonify({"status": "Backend OK", "wireguard_config": WIREGUARD_PATH})

@app.route("/peers", methods=["GET"])
def list_peers():
    peers = []
    try:
        for f in os.listdir(WIREGUARD_PATH):
            if f.startswith("peer_") and f.endswith(".conf"):
                peers.append(f.replace("peer_", "").replace(".conf", ""))
    except FileNotFoundError:
        return jsonify({"error": "WireGuard config directory not found"}), 500
    return jsonify(peers)

def generate_wireguard_keys():
    """Generate WireGuard private and public keys"""
    private_key = x25519.X25519PrivateKey.generate()
    
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    
    # WireGuard uses base64 encoding
    private_key_b64 = base64.b64encode(private_bytes).decode('utf-8')
    public_key_b64 = base64.b64encode(public_bytes).decode('utf-8')
    
    return private_key_b64, public_key_b64

def get_server_public_key():
    """Extract server public key from WireGuard configuration"""
    try:
        server_conf_path = os.path.join(WIREGUARD_PATH, "wg0.conf")
        with open(server_conf_path, 'r') as f:
            for line in f:
                if line.startswith('PrivateKey = '):
                    private_key_b64 = line.split(' = ')[1].strip()
                    private_key_bytes = base64.b64decode(private_key_b64)
                    private_key = x25519.X25519PrivateKey.from_private_bytes(private_key_bytes)
                    public_key = private_key.public_key()
                    public_key_bytes = public_key.public_bytes(
                        encoding=serialization.Encoding.Raw,
                        format=serialization.PublicFormat.Raw
                    )
                    return base64.b64encode(public_key_bytes).decode('utf-8')
    except Exception as e:
        print(f"Warning: Could not read server public key: {e}")
        return "SERVER_PUBLIC_KEY_PLACEHOLDER"

@app.route("/add-peer", methods=["POST"])
def add_peer():
    try:
        name = request.json.get("name")
        if not name:
            return jsonify({"error": "peer name required"}), 400
        
        # Clean the name to avoid path traversal
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_'))
        
        # Generate keys
        private_key, public_key = generate_wireguard_keys()
        server_public_key = get_server_public_key()
        
        # Calculate next available IP
        existing_peers = len([f for f in os.listdir(WIREGUARD_PATH) if f.startswith("peer_") and f.endswith(".conf")])
        peer_ip = f"192.0.0.{existing_peers + 2}"
        
        # Create peer configuration
        peer_config = f"""[Interface]
PrivateKey = {private_key}
Address = {peer_ip}/32
DNS = 8.8.8.8

[Peer]
PublicKey = {server_public_key}
Endpoint = 192.168.8.10:51820
AllowedIPs = 0.0.0.0/0
"""
        
        # Write peer configuration
        peer_config_path = os.path.join(WIREGUARD_PATH, f"peer_{name}.conf")
        with open(peer_config_path, "w") as f:
            f.write(peer_config)
        
        return jsonify({
            "message": f"Peer {name} created successfully",
            "peer_name": name,
            "config_file": f"peer_{name}.conf",
            "ip_address": peer_ip,
            "public_key": public_key
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/peer/<name>", methods=["GET"])
def get_peer_config(name):
    """Get the configuration file for a specific peer"""
    try:
        # Clean the name
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_'))
        
        config_path = os.path.join(WIREGUARD_PATH, f"peer_{name}.conf")
        
        with open(config_path, 'r') as f:
            config_content = f.read()
        
        return jsonify({
            "peer_name": name,
            "config": config_content
        })
    except FileNotFoundError:
        return jsonify({"error": "Peer configuration not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/peer/<name>", methods=["DELETE"])
def delete_peer(name):
    """Delete a peer configuration"""
    try:
        # Clean the name
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_'))
        
        config_path = os.path.join(WIREGUARD_PATH, f"peer_{name}.conf")
        
        if os.path.exists(config_path):
            os.remove(config_path)
            return jsonify({"message": f"Peer {name} deleted successfully"})
        else:
            return jsonify({"error": "Peer not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)