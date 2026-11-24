import { login } from "../auth/auth.js";
import { validateEmail, validateRequired } from "../utils/validation.js";
import { showError } from "../utils/notifications.js";
import { redirectAfterLogin } from "./_shared.js";

$("#login-form").on("submit", async (event) => {
  event.preventDefault();
  const email = $("#email").val().trim();
  const password = $("#password").val();

  if (!validateRequired(email) || !validateRequired(password) || !validateEmail(email)) {
    showError("Please enter a valid email and password.");
    return;
  }

  try {
    const user = await login({ email, password });
    redirectAfterLogin(user);
  } catch (error) {
    showError(error.message || "Login failed.");
  }
});
