export class LobbyData {
    static data ={
        participants: [],
        max_participants: 0,
        join_code: "",
        lobby_name: "Loading...",
        started_at: new Date().toISOString(),
    }
    
    static setData(data) {
        LobbyData.data = { ...data };
    }
}