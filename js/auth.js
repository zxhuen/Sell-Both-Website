// 1. Initialize Supabase Client

const SUPABASE_URL = "https://xolodghudewagudmyxos.supabase.co";

const SUPABASE_ANON_KEY =
    "YOUR_EXISTING_SUPABASE_ANON_KEY";

const LOGIN_ENDPOINT =
    window.LOGIN_ENDPOINT || "https://sellbot-api.onrender.com/Login/";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// 2. DOM Elements

const btnGoogle = document.getElementById("btn-google");
const btnLogout = document.getElementById("btn-logout");


// 3. Google OAuth Sign-In

async function signInWithGoogle() {

    btnGoogle.disabled = true;

    const { error } =
    await supabaseClient.auth.signInWithOAuth({
        provider: "google",

        options: {
            // Return to login page after Google authentication.
            // The login page will then authenticate with FastAPI.
            redirectTo: window.location.origin +
                window.location.pathname,
        },
    });

    if (error) {

        console.error(
            "Google OAuth error:",
            error.message
        );

        btnGoogle.disabled = false;
    }
}


// 4. Authenticate User With FastAPI

async function authenticateWithBackend(session) {

    if (!session) {
        return;
    }

    console.log("Supabase session found.");
    console.log("User:", session.user.email);

    try {

        const response = await fetch(
            LOGIN_ENDPOINT, {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            }
        );

        const result =
            await response.text();

        console.log(
            "FastAPI status:",
            response.status
        );

        console.log(
            "FastAPI response:",
            result
        );


        if (!response.ok) {

            console.error(
                "FastAPI rejected authentication:",
                response.status,
                result
            );

            await supabaseClient.auth.signOut();

            return;
        }


        // Backend successfully
        // authenticated/registered the user.

        console.log(
            "Backend authentication successful."
        );

        window.location.href = "index.html";

    } catch (error) {

        console.error(
            "Failed to authenticate with backend:",
            error
        );
    }
}


// 5. Sign Out

async function signOut() {

    const { error } =
    await supabaseClient.auth.signOut();

    if (error) {

        console.error(
            "Sign-out error:",
            error.message
        );

        return;
    }

    window.location.href = "login.html";
}


// 6. Google Button

if (btnGoogle) {

    btnGoogle.addEventListener(
        "click",
        signInWithGoogle
    );
}


// 7. Logout Button

if (btnLogout) {

    btnLogout.addEventListener(
        "click",
        signOut
    );
}


// 8. Check Supabase Session After OAuth Redirect

window.addEventListener("DOMContentLoaded", async() => {

    console.log("Checking Supabase session...");

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();

    console.log("SESSION:", session);
    console.log("ERROR:", error);

    if (!session) {
        console.log("No valid Supabase session.");
        return;
    }

    console.log("User:", session.user);
    console.log("Access token exists:", !!session.access_token);

    await authenticateWithBackend(session);
});