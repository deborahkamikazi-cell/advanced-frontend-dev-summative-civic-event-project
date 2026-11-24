import { signup } from "../auth/auth.js";
import { validateEmail, validatePasswordStrength, validateRequired } from "../utils/validation.js";
import { showError, showSuccess } from "../utils/notifications.js";

const $password = $("#password");
const $passwordStrength = $("#password-strength");

$password.on("input", () => {
  const { checks } = validatePasswordStrength($password.val());
  const passedChecks = Object.entries(checks).filter(([, passed]) => passed).length;
  $passwordStrength.text(`Password checks passed: ${passedChecks}/5`);
});

$("#signup-form").on("submit", async (event) => {
  event.preventDefault();

  const full_name = $("#full_name").val().trim();
  const email = $("#email").val().trim();
  const password = $("#password").val();

  if (!validateRequired(full_name) || !validateEmail(email)) {
    showError("Please provide valid full name and email.");
    return;
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    showError("Password must include uppercase, lowercase, number, special character, and 8+ length.");
    return;
  }

  try {
    await signup({ full_name, email, password, role: "user" });
    showSuccess("Signup successful. You can now login.");
    window.location.href = "/pages/auth/login.html";
  } catch (error) {
    showError(error.message || "Signup failed.");
  }
});
