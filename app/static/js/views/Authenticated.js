import AbstractView from "./AbstractView.js";
import "../../components/Spinner.js";

export default class Authenticated extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Authentication Response");
    }
    
    async getHtml() {
        return `
            <loading-spinner></loading-spinner>
        `;
    }
}