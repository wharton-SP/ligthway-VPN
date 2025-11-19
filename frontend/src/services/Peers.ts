import type { addResponse, getPeerResponse, responseServInfo } from "../types/Types";

const base_url = "http://192.168.88.30:5000";

export const reload_server = async () => {
}

export const get_peers = async (): Promise<any> => {
    const res = await fetch(`${base_url}/peers`)
    if (!res.ok) throw new Error('failed at fetching');
    return res.json();
}

export const get_peer = async (name: string): Promise<getPeerResponse> => {
    const res = await fetch(`${base_url}/peer/${name}`)
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || `Request failed with satus ${res.status}`)
    }
    return (res.json());
}

export const add_peers = async (name: string): Promise<addResponse> => {
    const res = await fetch(`${base_url}/add-peer`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        }
    )

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || `Request failed with status ${res.status}`)
    }
    return (res.json())
}

export const delete_peers = async (name: string) => {
    const res = await fetch(`${base_url}/peer/${name}`,
        {
            method: 'DELETE',
        }
    )

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || `Request failed with satus ${res.status}`)
    }
    return (res.json());
}

export const get_server_info = async (): Promise<responseServInfo> => {
    const res = await fetch(`${base_url}/server-info`)
    if (!res.ok) throw new Error('failed at fetching');
    return res.json();
}