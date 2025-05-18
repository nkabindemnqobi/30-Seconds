import { ApplicationConfiguration } from "../../../models/app-config.js";
import { LobbyData } from "../../../models/LobbyData.js";
import { User } from "../../../models/user.js";
import EventBus from "./eventbus.js";

let eventSource = null;
let isInitialized = false;

export const initSSE = async () => {

  if (isInitialized && eventSource) {
    console.log("[SSE] Already initialized");
    return;
  }
  try {
    const googleId = User.user.googleId;
    const eventSource = new EventSource(`${ApplicationConfiguration.apiBaseUrl}/sse/connect/${googleId}`);

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened.");
    };

    const supportedEvents = [
      "match_created",
      "game_started",
      "round_started",
      "your_turn",
      "wrong_guess",
      "round_timeout",
      "game_ended",
      "hint_requested",
      "player_join"
    ];

    supportedEvents.forEach((eventName) => {
      eventSource.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`[SSE] ${eventName}:`, data);
          EventBus.emit(eventName, data);
          if(eventName === 'player_join'){
            LobbyData.setData(data.lobbyData.data);
          }
          else if (eventName === 'match_created'){
            console.log(data)
            LobbyData.setData(data.data);
          }
        } catch (err) {
          console.error(`[SSE] Failed to parse data for ${eventName}`, err);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize SSE:', error);
    isInitialized = false;
  }

};

export const isSSEInitialized = () => {
  return isInitialized && eventSource !== null;
};

export const cleanupSSE = () => {
  if (eventSource) {
      eventSource.close();
      eventSource = null;
      isInitialized = false;
  }
}

export default initSSE;
