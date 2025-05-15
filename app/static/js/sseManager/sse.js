import { ApplicationConfiguration } from "../../../models/app-config.js";
import { User } from "../../../models/user.js";

export function initSSE() {
  const googleId = User.user.googleId;
  const eventSource = new EventSource(`${ApplicationConfiguration.apiBaseUrl}/sse/connect/${googleId}`);

  eventSource.onopen = () => {
    console.log("[SSE] Connection opened.");
  };

  eventSource.onerror = (err) => {
    console.error("[SSE] Connection error:", err);
  };

  eventSource.addEventListener("match_created", (event) => {
    const data = JSON.parse(event.data);
    console.log("[SSE] Match Created:", data);
  });

  eventSource.addEventListener("round_started", (event) => {
    const data = JSON.parse(event.data);
    console.log("[SSE] Round Started:", data);
  });

  eventSource.addEventListener("your_turn", (event) => {
    const data = JSON.parse(event.data);
    console.log("[SSE] Your Turn - Hint:", data);
  });

  eventSource.addEventListener("wrong_guess", (event) => {
    const data = JSON.parse(event.data);
    console.log("[SSE] Incorrect Guess:", data);
  });

  eventSource.addEventListener("round_complete", (event) => {
    const data = JSON.parse(event.data);
    console.log("[SSE] Round Complete:", data);
  });
}
