import "../../components/Button.js";
import "../../components/Countdown.component.js";
import "../../components/Hints.js";
import "../../components/TextInput.component.js";
import GameController from "../../../services/gameplay.service.js";

export default class GamePlay {
    constructor(params) {
        this.params = params;
        this.gameController = null;
        document.title = "30 Seconds - Game Play";
    }
   
    async getHtml() {
        return `
        <section class="card">
            <countdown-timer
                seconds="30"
                team="Team Red"
                question-id="q1">
            </countdown-timer>
            <main class="card-content" id="appContent">
                <hint-box value="10 points"></hint-box>  
                <text-input></text-input>      
                <app-button leftIcon="check" id="login-button" class="blue-button">Submit</app-button>
            </main>
        </section>
        `;
    }
    
    initGameController() {
        if (!this.gameController) {
            this.gameController = new GameController();
            this.gameController.init();
            console.log("Game controller initialized from GamePlay view");
        }
    }
}