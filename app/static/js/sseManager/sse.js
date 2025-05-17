import { ApplicationConfiguration } from "../../../models/app-config.js";
import { User } from "../../../models/user.js";
import EventBus from "./eventbus.js";

export default function initSSE() {
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
    "hint_requested"
  ];

  supportedEvents.forEach((eventName) => {
    eventSource.addEventListener(eventName, (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[SSE] ${eventName}:`, data);
        EventBus.emit(eventName, data);
      } catch (err) {
        console.error(`[SSE] Failed to parse data for ${eventName}`, err);
      }
    });
  });
}
