const AUTH_API_URL =
  "https://script.google.com/macros/s/AKfycbwTl_eVZV5QCELNsvKtUGDb9h0lyDySiry1qXf8gDPOFWt4ZYhtrEfU4vP95D7MI4ha1Q/exec";

const AUTH_SESSION_KEY = "spellingbee_session";

function getSession() {
  const session = sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session);
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function isAuthenticated() {
  return getSession() !== null;
}

async function login(username, password) {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (!data.ok || !data.user) {
      return false;
    }

    sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        username: data.user.username,
        displayName: data.user.displayName,
        role: data.user.role,
        loginAt: new Date().toISOString(),
      }),
    );

    return true;
  } catch (error) {
    console.error("Authentication error:", error);
    return false;
  }
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.location.href = "login.html";
}

/*
 * Protección de páginas.
 *
 * Para proteger una página:
 * <html data-auth-required="true">
 */
if (
  document.documentElement.dataset.authRequired === "true" &&
  !isAuthenticated()
) {
  window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", () => {
  /*
   * Mostrar nombre del usuario actual en index.html
   */
  const currentUserName = document.getElementById("currentUserName");

  if (currentUserName) {
    const session = getSession();

    if (session?.displayName) {
      currentUserName.textContent = session.displayName;
    }
  }

  /*
   * Logout
   */
  const logoutButton = document.getElementById("logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }

  /*
   * Login
   */
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    /*
     * Si ya existe una sesión, no tiene sentido volver a mostrar login.
     */
    if (isAuthenticated()) {
      window.location.replace("index.html");
      return;
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document
        .getElementById("username")
        .value
        .trim();

      const passwordInput = document.getElementById("password");
      const password = passwordInput.value;

      const errorMessage = document.getElementById("loginError");
      const loginButton = document.getElementById("loginButton");

      errorMessage.classList.add("d-none");

      loginButton.disabled = true;
      loginButton.innerHTML = "Signing in...";

      const authenticated = await login(username, password);

      if (authenticated) {
        window.location.replace("index.html");
        return;
      }

      loginButton.disabled = false;
      loginButton.innerHTML =
        '<i class="fas fa-sign-in-alt mr-2"></i> Login';

      errorMessage.classList.remove("d-none");

      passwordInput.value = "";
      passwordInput.focus();
    });
  }
});