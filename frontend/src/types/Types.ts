export interface getPeerResponse{
    peer_name: string;
    config: string;
}

export interface addResponse{
    message: string;
    peer_name: string;
    ip_address: string;
    config_file: string;
    directory: string;
}

export interface responseServInfo{
    server_public_key: string,
    publickey_server_exists: boolean;
    wg0_conf_exists: boolean;
    existing_peers_count: number;
    wireguard_path: string;
}

// types.ts
export type Peer = {
  name: string;
  bandwidth: {
    recv_kbps: number;
    recv_mbps: number;
    sent_kbps: number;
    sent_mbps: number;
  };
  metrics: {
    allowed_ips: string;
    is_active: boolean;
    last_handshake: string | null;
    status: string;
    time_since_handshake: string | null;
    traffic: {
    received_bytes: number;
    received_mb: number;
    sent_bytes: number;
    sent_mb: number;
    total_bytes: number;
    total_mb: number;
  };
  };
};

export type Summary = {
  active_peers: number;
  inactive_peers: number;
  total_peers: number;
  total_received_bytes: number;
  total_sent_bytes: number;
  total_traffic_gb: number;
  current_bandwidth_recv_mbps: number;
  current_bandwidth_sent_mbps: number;
  current_bandwidth_total_mbps: number;
  total_received_gb:number;
  total_sent_gb:number;
};

export type ServerData = {
  count: number;
  peers: Peer[];
  summary: Summary;
};

