// 1. Initialize Supabase Client
const SUPABASE_URL = "https://xolodghudewagudmyxos.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvbG9kZ2h1ZGV3YWd1ZG15eG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDU1NjYsImV4cCI6MjEwMTMyMTU2Nn0.Bzhnute26nCxgrxfQXKSdL1mF38BmoNCeyUwl58Gx3E";
const LOGIN_ENDPOINT = window.LOGIN_ENDPOINT || "https://sellbot-api.onrender.com";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM Elements
const loginView = document.getElementById("login-view");
const userView = document.getElementById("user-view");
const btnGoogle = document.getElementById("btn-google");
const btnLogout = document.getElementById("btn-logout");

const userAvatar = document.getElementById("user-avatar");
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");

let authRequestInProgress = false;

function redirectToIndex() {
    // Prevent infinite loop if already on index.html
    if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
        window.location.href = "index.html";
    }
}

async function authenticateWithBackend(session) {
    if (!session || authRequestInProgress) {
        return;
    }

    authRequestInProgress = true;

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        let result = {};
        try {
            result = await response.json();
        } catch (parseError) {
            result = {};
        }

        if (!response.ok) {
            throw new Error(result.detail || result.message || `Server error: ${response.status}`);
        }

        // Successfully authenticated with FastAPI backend
        redirectToIndex();

    } catch (error) {
        console.error("Backend login failed:", error.message);

        // Stop infinite redirect loop: Display error on UI instead of redirecting
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has("error")) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("error", error.message);
            window.history.replaceState({}, "", currentUrl);
        }

        // Display error message to user if container exists
        const errorDisplay = document.getElementById("error-message");
        if (errorDisplay) {
            errorDisplay.textContent = error.message;
            errorDisplay.style.display = "block";
        }
    } finally {
        authRequestInProgress = false;
    }
}

// 3. Google OAuth Sign-In
async function signInWithGoogle() {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/login.html?auth=callback`,
        },
    });

    if (error) {
        console.error("Error logging in:", error.message);
    }
}

// 4. Sign-Out
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Error signing out:", error.message);
    } else {
        window.location.href = "login.html";
    }
}

// 5. Render UI state depending on session
function renderUI(session) {
    if (!loginView || !userView) {
        return;
    }

    if (session) {
        const user = session.user;
        if (userAvatar) {
            userAvatar.src = user.user_metadata.avatar_url || "https://via.placeholder.com/64";
        }
        if (userName) {
            userName.textContent = user.user_metadata.full_name || "User";
        }
        if (userEmail) {
            userEmail.textContent = user.email;
        }

        loginView.style.display = "none";
        userView.style.display = "flex";
    } else {
        loginView.style.display = "block";
        userView.style.display = "none";
    }
}

// 6. Listeners & Single Entry Point Initialization
if (btnGoogle) {
    btnGoogle.addEventListener("click", signInWithGoogle);
}
if (btnLogout) {
    btnLogout.addEventListener("click", signOut);
}

// Single auth state entry point (removed duplicate window.onload hook)
supabaseClient.auth.onAuthStateChange(async(_event, session) => {
    renderUI(session);

    if (session && (_event === "SIGNED_IN" || _event === "INITIAL_SESSION")) {
        await authenticateWithBackend(session);
    }
});