import AbstractView from "./AbstractView.js";

export default class Login extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Login");
    }
    
    async getHtml() {
        return `
            <section class="card">
                <button id="login-button" class="create"> Sign in with Google </button>
            </section>
        `;
    }
}