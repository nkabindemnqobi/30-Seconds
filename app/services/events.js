import { ApplicationConfiguration } from "../models/app-config.js";
import { User } from "../models/user.js";

class SSEManager {
  constructor() {
    this.eventSource = null;
    this.subscribers = {}; 
  }

  init() {
    if (this.eventSource || !User.user?.googleId) return;

    const googleId = User.user.googleId;
    const url = `${ApplicationConfiguration.apiBaseUrl}/sse/connect/${googleId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log("[SSE] Connection opened.");
    };

    this.eventSource.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
    };

    const supportedEvents =   ["match_created", "round_started", "your_turn", "wrong_guess", "round_timeout","game_ended","hint_requested"];

    for (const eventType of supportedEvents) {
      this.eventSource.addEventListener(eventType, (event) => {
        const parsedData = JSON.parse(event.data);
        this._dispatch(eventType, parsedData);
      });
    }
  }

  _dispatch(eventType, payload) {
    const callbacks = this.subscribers[eventType] || [];
    for (const callback of callbacks) {
      try {
        callback(payload);
      } catch (err) {
        console.error(`[SSE] Error in handler for "${eventType}":`, err);
      }
    }
  }

  on(eventType, callback) {
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
    }
    this.subscribers[eventType].push(callback);
  }

  off(eventType, callback) {
    if (!this.subscribers[eventType]) return;
    this.subscribers[eventType] = this.subscribers[eventType].filter(cb => cb !== callback);
  }
}

export default new SSEManager();



