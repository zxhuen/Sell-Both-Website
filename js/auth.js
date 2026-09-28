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


const btnGoogle =
    document.getElementById("btn-google");


// Google Login

async function signInWithGoogle() {

    btnGoogle.disabled = true;

    const { error } =
    await supabaseClient.auth.signInWithOAuth({
        provider: "google",

        options: {
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


// Send Supabase session to FastAPI

async function authenticateWithBackend(session) {

    console.log(
        "Authenticating with FastAPI..."
    );

    console.log(
        "User:",
        session.user.email
    );

    try {

        const response =
            await fetch(LOGIN_ENDPOINT, {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });


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
                "FastAPI rejected user."
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


// After Google redirects back

window.addEventListener(
    "DOMContentLoaded",
    async() => {

        console.log(
            "Login page loaded."
        );


        const {
            data: { session },
            error
        } =
        await supabaseClient.auth.getSession();


        console.log(
            "Session:",
            session
        );

        console.log(
            "Session error:",
            error
        );


        if (error) {

            console.error(
                "Supabase session error:",
                error
            );

            return;
        }


        if (!session) {

            console.log(
                "No Supabase session."
            );

            return;
        }


        console.log(
            "Supabase OAuth successful."
        );

        console.log(
            "User:",
            session.user.email
        );

        console.log(
            "Access token exists:", !!session.access_token
        );


        await authenticateWithBackend(
            session
        );
    }
);


// Google button

if (btnGoogle) {

    btnGoogle.addEventListener(
        "click",
        signInWithGoogle
    );
}