import AnimationHandler from "./AnimationHandler.js";

const BTN_ID = "login-btn";
const EMAIL = "email";
const PASS = "password";
const LOGIN_PATH = "/users/login";

function redirectTo(route) {
  location.href = route;
}

(function insertAnimation() {
  let animHandler = new AnimationHandler();
  let loginButton = document.getElementById(BTN_ID);

  if (!loginButton) {
    return;
  }

  // Add a listener for the login success animation ending
  animHandler.onAnimationComplete = () => {
    redirectTo("/");
  };

  // Override the onclick submit behaviour
  loginButton.onclick = async e => {
    e.preventDefault();

    // Send the form manually and wait for the response
    let formData = new URLSearchParams();
    let sentEmail = document.getElementById(EMAIL).value;
    let sentPass = document.getElementById(PASS).value;

    formData.set(EMAIL, sentEmail);
    formData.set(PASS, sentPass);

    const response = await fetch(location.href, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    // The content type of the response
    let contentType = response.headers.get("Content-Type");

    // The login credentials were accepted
    if (contentType.includes("json")) {
      // If the login goes well, the response should be json
      try {
        let parsedResponse = await response.json();

        if (parsedResponse.success) {
          animHandler.playLoginSuccess();
        }
      } catch (err) {
        redirectTo(LOGIN_PATH);
      }
    }
    // The content is html so probably the login credentials were not correct
    else if (contentType.includes("html")) {
      // Replace the whole page with the returned body
      try {
        let newDocument = await response.text();

        document.open("text/html");
        document.write(newDocument);
        document.close();

        // After the new pages loads, start the new animation
        window.onload = () => {
          insertAnimation();
        };
      } catch (err) {
        redirectTo(LOGIN_PATH);
      }
    }
  };
})();
