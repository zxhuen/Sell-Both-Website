const SUPABASE_URL =
    "https://xolodghudewagudmyxos.supabase.co";

const SUPABASE_ANON_KEY =
    "YOUR_EXISTING_SUPABASE_ANON_KEY";

const LOGIN_ENDPOINT =
    window.LOGIN_ENDPOINT ||
    "https://sellbot-api.onrender.com/Login/";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


const googleBtn =
    document.getElementById("btn-google");


// ============================================================
// GOOGLE LOGIN
// ============================================================

googleBtn.addEventListener("click", async() => {

    googleBtn.disabled = true;

    console.log("Starting Google OAuth...");

    const { error } =
    await supabaseClient.auth.signInWithOAuth({
        provider: "google",

        options: {
            redirectTo: window.location.origin +
                window.location.pathname
        }
    });

    if (error) {

        console.error(
            "OAuth trigger error:",
            error
        );

        googleBtn.disabled = false;
    }
});


// ============================================================
// SEND SUPABASE SESSION TO FASTAPI
// ============================================================

async function authenticateWithBackend(session) {

    console.log(
        "Authenticating with FastAPI..."
    );

    console.log(
        "User:",
        session.user.email
    );

    console.log(
        "Access token exists:", !!session.access_token
    );


    try {

        const response =
            await fetch(LOGIN_ENDPOINT, {

                method: "POST",

                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });


        console.log(
            "FastAPI status:",
            response.status
        );


        const result =
            await response.text();


        console.log(
            "FastAPI response:",
            result
        );


        if (!response.ok) {

            console.error(
                "FastAPI rejected authentication."
            );

            return;
        }


        console.log(
            "Backend authentication successful."
        );


        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "FastAPI request failed:",
            error
        );
    }
}


// ============================================================
// LOGIN PAGE LOAD
// ============================================================

window.addEventListener("DOMContentLoaded", async() => {

    console.log("=== LOGIN PAGE LOADED ===");

    const result =
        await supabaseClient.auth.getSession();

    console.log("getSession result:", result);

    console.log("session:", result.data.session);
    console.log("error:", result.error);

    if (!result.data.session) {
        console.log("NO SESSION -> FastAPI will NOT be called");
        return;
    }

    console.log("SESSION FOUND");
    console.log("email:", result.data.session.user.email);
    console.log(
        "access token exists:", !!result.data.session.access_token
    );

    await authenticateWithBackend(
        result.data.session
    );
});