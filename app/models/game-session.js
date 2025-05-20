export class GameSession {
  static data = {
    scores: [],
  };

  static setData(scores) {
    GameSession.data = scores;
  }
}
