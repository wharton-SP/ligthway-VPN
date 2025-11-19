const base_url = "http://10.88.87.251:5000";


export const reload_wg = async () =>{
    const res = await fetch(`${base_url}/reload-wireguard`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }
    )

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || `Request failed with status ${res.status}`)
    }
    return (res.json())
}