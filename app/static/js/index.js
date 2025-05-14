import Dashboard from "./views/Dashboard.js";
import CreateLobby from "./views/CreateLobby.js";
import NotFound from "./views/NotFound.js";
import Login from "./views/Login.js";
import JoinLobby from "./views/JoinLobby.js";
import GamePlay from "./views/GamePlay.js";
import { ApplicationConfiguration } from "../../models/app-config.js";
import { GoogleAuth } from "../../services/google-auth.service.js";
import Authenticated from "./views/Authenticated.js";

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
const googleAuth = new GoogleAuth();

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
    
    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/lobby", view: Dashboard },
        { path: "/create-lobby", view: CreateLobby },
        { path: "/error", view: NotFound },
        { path: "/", view: Login },
        { path: "/signin-google", view: Authenticated },
        { path: "/join-lobby", view: JoinLobby},
        { path: "/game-play", view: GamePlay}
    ];

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

    if (!match) {
        match = {
            route: routes.find(route => route.path === "/error"),
            result: [location.pathname]
        };
    }

    const view = new match.route.view(getParams(match));
    
    document.querySelector("#app").innerHTML = await view.getHtml();

    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get("code");
    if(accessCode) {
        const token = await googleAuth.exchangeCodeForToken(accessCode);
        if(token.idToken && token.googleId) {
            history.pushState({}, "", "/lobby");
            router();
        } else {
            history.pushState({}, "", "/error");
            router();
        }
    }
    attachEventListeners();
};

const attachEventListeners = () => {
    const lobbyForm = document.getElementById("lobbyForm");
    if (lobbyForm) {
        lobbyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            console.log("Form submitted");
        });
    }

   

    const loginButton = document.getElementById("login-button");
    if(loginButton) {
        loginButton.addEventListener("click", (clickEvent) => {
            clickEvent.preventDefault();
            window.location.href = ApplicationConfiguration.redirectUrl;
        })
    }
};

// Add event listeners for navigation
document.addEventListener("DOMContentLoaded", () => {
    if(!ApplicationConfiguration.redirectUrl) googleAuth.getApplicationConfiguration();
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });
    router();
});

window.addEventListener("popstate", router);