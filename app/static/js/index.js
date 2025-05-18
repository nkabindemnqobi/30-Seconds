import Dashboard from "./views/Dashboard.js";
import CreateLobby from "./views/CreateLobby.js";
import NotFound from "./views/NotFound.js";
import JoinLobby from "./views/JoinLobby.js";
import Lobby from "./views/LobbyView.js";
import GamePlay from "./views/GamePlay.js";
import { ApplicationConfiguration } from "../../models/app-config.js";
import { GoogleAuth } from "../../services/google-auth.service.js";
import Authenticated from "./views/Authenticated.js";
import { initSSE, isSSEInitialized } from "./sseManager/sse.js";
import PlayerLobby from "./views/PlayerLobby.js";

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

let currentView = null;

const router = async () => {
    const routes = [
        { path: "/create-lobby", view: CreateLobby },
        { path: "/error", view: NotFound },
        { path: "/", view: Dashboard },
        { path: "/signin-google", view: Authenticated },
        { path: "/join-lobby", view: JoinLobby },
        { path: "/game-play", view: GamePlay },
        { path: "/lobby", view: Lobby },
        { path: "/trivia-lobby", view: PlayerLobby}
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

    currentView = new match.route.view(getParams(match));

    const sanitizeAndRender = async (container, htmlContent) => {


        container.textContent = '';
        const temp = document.createElement('div');
        temp.textContent = htmlContent;
        const template = document.createElement('template');
        template.innerHTML = temp.textContent;

        container.appendChild(template.content);
    };

    const appContainer = document.querySelector("#app");
    const htmlContent = await currentView.getHtml();
    sanitizeAndRender(appContainer, htmlContent);

    const urlParams = new URLSearchParams(window.location.search);
    const accessCode = urlParams.get("code");
    if (accessCode) {
        const token = await googleAuth.exchangeCodeForToken(accessCode);
        if (token.idToken && token.googleId) {
            if(!isSSEInitialized()){
                await initSSE();
            }
            history.pushState(null, null, "/");
            router();
        } else {
            history.pushState(null, null, "/error");
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
            
        });
    }

    const loginButton = document.getElementById("login-button");
    if (loginButton) {
        const newLoginButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newLoginButton, loginButton);

        if (!(currentView instanceof GamePlay)) {
            newLoginButton.addEventListener("click", async (clickEvent) => {
                clickEvent.preventDefault();
                if (!ApplicationConfiguration.appConfig.authUrl) {
                    const authorizationUrls = await googleAuth.getApplicationConfiguration();
                    window.location.href = authorizationUrls.authUrl;
                } else {
                    window.location.href = ApplicationConfiguration.appConfig.authUrl;
                }
            });
        }
    }
};

const checkAndInitializeSSE = async () => {
    const isAuthenticated = await googleAuth.isAuthenticated(); 
    if (isAuthenticated && !isSSEInitialized()) {
        await initSSE();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (!ApplicationConfiguration.redirectUrl) googleAuth.getApplicationConfiguration();
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    const initializeAsync = async () => {
        await checkAndInitializeSSE();
        await router();
    }
    
    initializeAsync().catch(error => {
        
    });
});

window.addEventListener("popstate", router);
export default router