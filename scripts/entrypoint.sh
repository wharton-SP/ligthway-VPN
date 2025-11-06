#!/bin/bash
set -e

echo "[*] Démarrage du VPN..."

# Créer les dossiers nécessaires
mkdir -p /etc/wireguard/clients

# Génération des clés SI nécessaire
if [ ! -f /etc/wireguard/wg0.conf ]; then
    echo "[*] Génération des clés WireGuard..."
    umask 077
    cd /etc/wireguard
    
    # Générer les clés et les sauvegarder
    wg genkey | tee privatekey | wg pubkey > publickey
    SERVER_PRIVATE_KEY=$(cat privatekey)
    SERVER_PUBLIC_KEY=$(cat publickey)
    
    echo "[+] Clés générées :"
    echo "Private: ${SERVER_PRIVATE_KEY:0:20}..."
    echo "Public: ${SERVER_PUBLIC_KEY:0:20}..."
    
    # Configuration de base
    cat > wg0.conf << EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIVATE_KEY
SaveConfig = false
EOF

    echo "[+] Configuration WireGuard créée"
else
    # Si wg0.conf existe mais pas les fichiers de clés, les régénérer
    if [ ! -f /etc/wireguard/privatekey ] || [ ! -f /etc/wireguard/publickey ]; then
        echo "[*] Régénération des fichiers de clés..."
        umask 077
        cd /etc/wireguard
        
        # Extraire la clé privée de wg0.conf
        SERVER_PRIVATE_KEY=$(grep 'PrivateKey' wg0.conf | cut -d'=' -f2 | tr -d ' ')
        if [ -n "$SERVER_PRIVATE_KEY" ]; then
            echo "$SERVER_PRIVATE_KEY" > privatekey
            echo "$SERVER_PRIVATE_KEY" | wg pubkey > publickey
            echo "[+] Fichiers de clés régénérés"
        fi
    fi
fi

# Essayer d'activer le forwarding (mais continuer si ça échoue)
if sysctl -w net.ipv4.ip_forward=1 2>/dev/null; then
    echo "[+] IP forwarding activé"
else
    echo "[!] IP forwarding non activé (système en lecture seule)"
fi

# Démarrer WireGuard (mais continuer si ça échoue)
echo "[*] Démarrage de WireGuard..."
if wg-quick up wg0 2>/dev/null; then
    echo "[+] WireGuard démarré avec succès"
    wg show
else
    echo "[!] WireGuard non démarré (continuer avec l'interface web)"
fi

# Démarrer l'application web
echo "[+] Démarrage de l'interface web sur le port 5000..."
cd /app
exec python app.py -h 0.0.0.0 -p 5000