import os
from config.settings import WIREGUARD_PATH

class ConfigService:
    @staticmethod
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

    @staticmethod
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
            server_public_key = ConfigService.get_server_public_key()
            peer_config = f"""[Interface]
Address = {peer_ip}
PrivateKey = {private_key}
ListenPort = 51820

[Peer]
PublicKey = {server_public_key}
PresharedKey = {preshared_key}
Endpoint = 192.168.43.30:51820
AllowedIPs = 0.0.0.0/0, 10.0.3.0/24
"""
            
            with open(os.path.join(peer_dir, "peer.conf"), "w") as f:
                f.write(peer_config)
            
            return peer_dir
            
        except Exception as e:
            print(f"Error creating peer directory: {e}")
            raise

    @staticmethod
    def create_peer_config_file(peer_name, peer_ip, private_key, preshared_key):
        """Create the .conf file for easy download"""
        server_public_key = ConfigService.get_server_public_key()
        peer_config_content = f"""[Interface]
Address = {peer_ip}
PrivateKey = {private_key}
ListenPort = 51820
DNS = 8.8.8.8

[Peer]
PublicKey = {server_public_key}
PresharedKey = {preshared_key}
Endpoint = 192.168.43.30:51820
AllowedIPs = 0.0.0.0/0, 10.0.3.0/24
"""
        
        conf_file_path = os.path.join(WIREGUARD_PATH, f"{peer_name}.conf")
        with open(conf_file_path, "w") as f:
            f.write(peer_config_content)
        
        return conf_file_path