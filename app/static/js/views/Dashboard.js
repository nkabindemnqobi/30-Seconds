import { GoogleAuth } from "../../../services/google-auth.service.js";
import AbstractView from "./AbstractView.js";

export default class Dashboard extends AbstractView {
    constructor(params) {
        super(params);
        const googleAuth = new GoogleAuth();
        console.log(googleAuth.retrieveToken());
        this.setTitle("Dashboard");
    }
    
    async getHtml() {
        return `
            <section class="card">
                <h1>Welcome to the Dashboard</h1>
                <p>Start by creating a new lobby or joining an existing one.</p>
                <a href="/create-lobby" data-link>Create Lobby</a>
            </section>
        `;
    }
}