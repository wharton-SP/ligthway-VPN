# app/vpn_manager.py
import os
import subprocess
import qrcode
import base64
import socket
from io import BytesIO

class VPNManager:
    def __init__(self):
        self.wg_config_path = "/etc/wireguard/wg0.conf"
        self.clients_dir = "/etc/wireguard/clients"
        os.makedirs(self.clients_dir, exist_ok=True)

    def get_local_ip(self):
        """Détecte automatiquement l'IP locale du serveur"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except:
            return "192.168.88.25"  # Fallback plus sûr

    def add_client(self, client_name):
        try:
            # Générer les clés du client
            private_key = subprocess.check_output(["wg", "genkey"]).decode().strip()
            public_key = subprocess.check_output(["wg", "pubkey"], input=private_key.encode()).decode().strip()
            
            # Obtenir l'IP du serveur
            server_ip = self.get_local_ip()
            server_public_key = self.get_server_public_key()
            
            # Déterminer l'IP du client
            existing_clients = self.list_clients()
            client_num = len(existing_clients) + 2
            client_ip = f"10.0.0.{client_num}"
            
            # Configuration client
            client_config = f"""[Interface]
    PrivateKey = {private_key}
    Address = {client_ip}/24
    DNS = 8.8.8.8

    [Peer]
    PublicKey = {server_public_key}
    Endpoint = {server_ip}:51820
    AllowedIPs = 0.0.0.0/0
    """
            
            # Sauvegarder la configuration client
            client_config_path = os.path.join(self.clients_dir, f"{client_name}.conf")
            with open(client_config_path, 'w') as f:
                f.write(client_config)
            
            # Ajouter le client à la configuration du serveur
            peer_config = f"\n# Client: {client_name}\n[Peer]\nPublicKey = {public_key}\nAllowedIPs = {client_ip}/32\n"
            
            with open(self.wg_config_path, 'a') as f:
                f.write(peer_config)
            
            # Ajouter le peer à l'interface WireGuard en cours d'exécution
            try:
                subprocess.run([
                    "wg", "set", "wg0", 
                    "peer", public_key, 
                    "allowed-ips", f"{client_ip}/32"
                ], check=True, capture_output=True)
                print(f"✓ Client {client_name} ajouté avec l'IP {client_ip}")
            except subprocess.CalledProcessError as e:
                print(f"⚠ Peer ajouté à la config mais pas à l'interface active: {e}")
            
            return client_config
            
        except Exception as e:
            raise Exception(f"Erreur lors de l'ajout du client: {str(e)}")

#     def add_client(self, client_name):
#         try:
#             private_key = subprocess.check_output(["wg", "genkey"]).decode().strip()
#             public_key = subprocess.check_output(["wg", "pubkey"], input=private_key.encode()).decode().strip()
            
#             server_ip = self.get_local_ip()
            
#             # Lire la configuration du serveur pour le réseau
#             network = "24"  # Valeur par défaut
#             if os.path.exists(self.wg_config_path):
#                 with open(self.wg_config_path, 'r') as f:
#                     server_config = f.read()
                
#                 # Trouver le réseau WireGuard
#                 for line in server_config.split('\n'):
#                     if line.startswith('Address'):
#                         server_address = line.split('=')[1].strip()
#                         network = server_address.split('/')[1]
#                         break
            
#             # IP du client
#             existing_clients = self.list_clients()
#             client_num = len(existing_clients) + 2
#             client_ip = f"10.0.0.{client_num}"
            
#             # Configuration client
#             client_config = f"""[Interface]
# PrivateKey = {private_key}
# Address = {client_ip}/{network}
# DNS = 8.8.8.8

# [Peer]
# PublicKey = {self.get_server_public_key()}
# Endpoint = {server_ip}:51820
# AllowedIPs = 0.0.0.0/0
# """
            
#             # Sauvegarder la configuration
#             client_config_path = os.path.join(self.clients_dir, f"{client_name}.conf")
#             with open(client_config_path, 'w') as f:
#                 f.write(client_config)
            
#             # Ajouter au serveur
#             peer_config = f"\n[Peer]\nPublicKey = {public_key}\nAllowedIPs = {client_ip}/32"
            
#             with open(self.wg_config_path, 'a') as f:
#                 f.write(peer_config)
            
#             # Recharger WireGuard
#             try:
#                 subprocess.run(["wg", "set", "wg0", "peer", public_key, "allowed-ips", f"{client_ip}/32"], check=True)
#                 print(f"Client {client_name} ajouté avec l'IP {client_ip}")
#             except subprocess.CalledProcessError as e:
#                 print(f"Warning: Could not add peer to running interface: {e}")
            
#             return client_config
            
#         except Exception as e:
#             raise Exception(f"Erreur lors de l'ajout du client: {str(e)}")

    def remove_client(self, client_name):
        client_config_path = os.path.join(self.clients_dir, f"{client_name}.conf")
        if os.path.exists(client_config_path):
            os.remove(client_config_path)
            
            # Recharger la configuration WireGuard
            try:
                subprocess.run(["wg-quick", "down", "wg0"], capture_output=True)
                subprocess.run(["wg-quick", "up", "wg0"], capture_output=True)
            except:
                pass  # Ignorer les erreurs de reload
            return True
        return False

    def list_clients(self):
        try:
            return [f[:-5] for f in os.listdir(self.clients_dir) if f.endswith('.conf')]
        except:
            return []

    def get_server_public_key(self):
        try:
            # Essayer de lire depuis le fichier publickey
            if os.path.exists('/etc/wireguard/publickey'):
                with open('/etc/wireguard/publickey', 'r') as f:
                    return f.read().strip()
            
            # Si le fichier n'existe pas, essayer d'extraire depuis wg0.conf
            if os.path.exists(self.wg_config_path):
                with open(self.wg_config_path, 'r') as f:
                    for line in f:
                        if line.startswith('PrivateKey'):
                            private_key = line.split('=')[1].strip()
                            # Générer la clé publique à partir de la clé privée
                            try:
                                public_key = subprocess.check_output(
                                    ["wg", "pubkey"], 
                                    input=private_key.encode()
                                ).decode().strip()
                                return public_key
                            except:
                                pass
        except Exception as e:
            print(f"Error getting server public key: {e}")
        
        return "SERVER_PUBLIC_KEY_NOT_FOUND"

    def generate_qr_code(self, config_text):
        qr = qrcode.QRCode()
        qr.add_data(config_text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()