from flask import Flask, jsonify, request
import os
import base64
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import serialization
import subprocess

app = Flask(__name__)

WIREGUARD_PATH = "/wireguard-config"

@app.route("/")
def home():
    return jsonify({"status": "Backend OK", "wireguard_config": WIREGUARD_PATH})

@app.route("/peers", methods=["GET"])
def list_peers():
    peers = []
    try:
        # Regarder dans le dossier principal pour les peers existants
        for f in os.listdir(WIREGUARD_PATH):
            if os.path.isdir(os.path.join(WIREGUARD_PATH, f)) and f != "server" and f != "templates" and f != "wg_confs":
                peers.append(f)
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

def generate_preshared_key():
    """Generate a preshared key (symmetric)"""
    psk = x25519.X25519PrivateKey.generate()
    psk_bytes = psk.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    return base64.b64encode(psk_bytes).decode('utf-8')

def get_server_public_key():
    """Extract server public key from the publickey-server file"""
    try:
        public_key_path = os.path.join(WIREGUARD_PATH, "server", "publickey-server")
        
        if os.path.exists(public_key_path):
            with open(public_key_path, 'r') as f:
                public_key = f.read().strip()
            return public_key
        else:
            return "SERVER_PUBLIC_KEY_PLACEHOLDER"
            
    except Exception as e:
        print(f"Error reading publickey-server: {e}")
        return "SERVER_PUBLIC_KEY_PLACEHOLDER"

def create_peer_directory_structure(peer_name, private_key, public_key, preshared_key, peer_ip):
    """Create the same directory structure as the WireGuard container expects"""
    try:
        # Create peer directory
        peer_dir = os.path.join(WIREGUARD_PATH, peer_name)
        os.makedirs(peer_dir, exist_ok=True)
        
        # Create key files
        with open(os.path.join(peer_dir, f"privatekey-{peer_name}"), "w") as f:
            f.write(private_key)
        
        with open(os.path.join(peer_dir, f"publickey-{peer_name}"), "w") as f:
            f.write(public_key)
        
        with open(os.path.join(peer_dir, f"presharedkey-{peer_name}"), "w") as f:
            f.write(preshared_key)
        
        # Create peer.conf using the same template structure
        server_public_key = get_server_public_key()
        peer_config = f"""[Interface]
Address = {peer_ip}
PrivateKey = {private_key}
ListenPort = 51820

[Peer]
PublicKey = {server_public_key}
PresharedKey = {preshared_key}
Endpoint = 192.168.8.10:51820
AllowedIPs = 0.0.0.0/0
"""
        
        with open(os.path.join(peer_dir, "peer.conf"), "w") as f:
            f.write(peer_config)
        
        return peer_dir
        
    except Exception as e:
        print(f"Error creating peer directory: {e}")
        raise

def add_peer_to_server_config(peer_name, peer_public_key, preshared_key):
    """Add the peer to the server configuration"""
    try:
        server_conf_path = os.path.join(WIREGUARD_PATH, "wg_confs", "wg0.conf")
        
        # Calculate next available IP (start from 3 since 2 is used by client1)
        existing_peers = len([f for f in os.listdir(WIREGUARD_PATH) 
                             if os.path.isdir(os.path.join(WIREGUARD_PATH, f)) and f not in ['server', 'templates', 'wg_confs']])
        peer_ip = f"192.0.0.{existing_peers + 2}"
        
        # Peer configuration to add to server (same format as original)
        peer_config = f"""
[Peer]
# {peer_name}
PublicKey = {peer_public_key}
PresharedKey = {preshared_key}
AllowedIPs = {peer_ip}/32
"""
        
        # Read current server config
        with open(server_conf_path, "r") as f:
            current_config = f.read()
        
        # Find the position to insert (before the last bracket if it exists, or at the end)
        if current_config.strip().endswith(']'):
            # Insert before the last section closing bracket
            lines = current_config.split('\n')
            new_lines = []
            for line in lines:
                if line.strip() == ']' and peer_config not in current_config:
                    new_lines.append(peer_config)
                    new_lines.append(']')
                else:
                    new_lines.append(line)
            new_config = '\n'.join(new_lines)
        else:
            # Just append
            new_config = current_config + peer_config
        
        # Write updated server configuration
        with open(server_conf_path, "w") as f:
            f.write(new_config)
        
        # Reload WireGuard configuration
        try:
            subprocess.run([
                "docker", "exec", "wireguard", 
                "wg", "syncconf", "wg0", 
                "/config/wg_confs/wg0.conf"
            ], check=True, capture_output=True, timeout=30)
            print("WireGuard configuration reloaded successfully")
        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not reload WireGuard config automatically: {e}")
            print("You may need to restart the WireGuard container manually")
        except subprocess.TimeoutExpired:
            print("Warning: WireGuard reload timed out")
        
        return peer_ip
        
    except Exception as e:
        print(f"Error adding peer to server: {e}")
        # Return a fallback IP
        return f"192.0.0.{existing_peers + 2}"

@app.route("/add-peer", methods=["POST"])
def add_peer():
    try:
        name = request.json.get("name")
        if not name:
            return jsonify({"error": "peer name required"}), 400
        
        # Clean the name to avoid path traversal
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_')).lower()
        
        # Check if peer already exists
        peer_dir = os.path.join(WIREGUARD_PATH, name)
        if os.path.exists(peer_dir):
            return jsonify({"error": f"Peer {name} already exists"}), 400
        
        # Generate keys
        private_key, public_key = generate_wireguard_keys()
        preshared_key = generate_preshared_key()
        
        # Add peer to server configuration and get assigned IP
        peer_ip = add_peer_to_server_config(name, public_key, preshared_key)
        
        # Create peer directory structure
        create_peer_directory_structure(name, private_key, public_key, preshared_key, peer_ip)
        
        # Also create the .conf file for easy download
        peer_config_content = f"""[Interface]
Address = {peer_ip}
PrivateKey = {private_key}
ListenPort = 51820

[Peer]
PublicKey = {get_server_public_key()}
PresharedKey = {preshared_key}
Endpoint = 192.168.8.10:51820
AllowedIPs = 0.0.0.0/0
"""
        
        conf_file_path = os.path.join(WIREGUARD_PATH, f"{name}.conf")
        with open(conf_file_path, "w") as f:
            f.write(peer_config_content)
        
        return jsonify({
            "message": f"Peer {name} created successfully",
            "peer_name": name,
            "ip_address": peer_ip,
            "config_file": f"{name}.conf",
            "directory": name
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/server-info", methods=["GET"])
def server_info():
    """Check server configuration and public key"""
    try:
        public_key_path = os.path.join(WIREGUARD_PATH, "server", "publickey-server")
        server_conf_path = os.path.join(WIREGUARD_PATH, "wg_confs", "wg0.conf")
        
        public_key_exists = os.path.exists(public_key_path)
        config_exists = os.path.exists(server_conf_path)
        
        server_public_key = get_server_public_key()
        
        # Count existing peers
        existing_peers = len([f for f in os.listdir(WIREGUARD_PATH) 
                             if os.path.isdir(os.path.join(WIREGUARD_PATH, f)) and f not in ['server', 'templates', 'wg_confs']])
        
        return jsonify({
            "server_public_key": server_public_key,
            "publickey_server_exists": public_key_exists,
            "wg0_conf_exists": config_exists,
            "existing_peers_count": existing_peers,
            "wireguard_path": WIREGUARD_PATH
        })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/peer/<name>", methods=["GET"])
def get_peer_config(name):
    """Get the configuration file for a specific peer"""
    try:
        # Clean the name
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_')).lower()
        
        config_path = os.path.join(WIREGUARD_PATH, f"{name}.conf")
        
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
        name = "".join(c for c in name if c.isalnum() or c in ('-', '_')).lower()
        
        # Remove peer directory
        peer_dir = os.path.join(WIREGUARD_PATH, name)
        if os.path.exists(peer_dir):
            import shutil
            shutil.rmtree(peer_dir)
        
        # Remove .conf file
        config_path = os.path.join(WIREGUARD_PATH, f"{name}.conf")
        if os.path.exists(config_path):
            os.remove(config_path)
            
        return jsonify({"message": f"Peer {name} deleted successfully"})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/reload-wireguard", methods=["POST"])
def reload_wireguard():
    """Manually reload WireGuard configuration"""
    try:
        result = subprocess.run(
            ["docker", "restart", "wireguard"],
            capture_output=True,
            text=True,
            check=True,
            timeout=30
        )
        return jsonify({"message": "WireGuard container restarted successfully"})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Failed to restart WireGuard: {e.stderr}"}), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "WireGuard restart timed out"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)