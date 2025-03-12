export interface NZBClient {
    name : string,
    id : string,
    username : boolean,
    password : boolean,
    apiKey : boolean
}

export const nzbClients : NZBClient[] = [
    {
        name: 'SABNzbd',
        id: 'sabnzbd',
        username: false,
        password: false,
        apiKey: true
    },
    {
        name: 'NZBGet',
        id: 'nzbget',
        username: true,
        password: true,
        apiKey: false
    },
]