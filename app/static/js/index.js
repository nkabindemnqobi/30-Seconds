import Dashboard from "./views/Dashboard.js";
import CreateLobby from "./views/CreateLobby.js";
import NotFound from "./views/NotFound.js";


const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

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
        { path: "/", view: Dashboard },
        { path: "/create-lobby", view: CreateLobby },
        { path: "/error", view: NotFound }
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

    // Handle team slider
    const teamSlider = document.getElementById("teamSlider");
    const teamCount = document.getElementById("teamCount");
    if (teamSlider && teamCount) {
        teamSlider.addEventListener("input", () => {
            teamCount.textContent = teamSlider.value;
        });
    }

    // Handle toggle switch
    const toggle = document.getElementById("toggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const isChecked = toggle.getAttribute("aria-checked") === "true";
            toggle.setAttribute("aria-checked", !isChecked);
        });
        
        toggle.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                const isChecked = toggle.getAttribute("aria-checked") === "true";
                toggle.setAttribute("aria-checked", !isChecked);
            }
        });
    }

    // Category selection
    const categoryButtons = document.querySelectorAll(".categories button");
    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("selected");
        });
    });
};

// Add event listeners for navigation
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            navigateTo(e.target.href);
        }
    });

    router();
});

window.addEventListener("popstate", router);