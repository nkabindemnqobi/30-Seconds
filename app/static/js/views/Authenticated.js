import AbstractView from "./AbstractView.js";

export default class Authenticated extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Authentication Response");
    }
    
    async getHtml() {
        return `
            <section class="card">
                <h1>Successfully Authenticated</h1>
            </section>
        `;
    }
}