import { signup } from "../auth/auth.js";
import { validateEmail, validatePasswordStrength, validateRequired } from "../utils/validation.js";
import { showError, showSuccess } from "../utils/notifications.js";

const $password = $("#password");
const $passwordStrength = $("#password-strength");
const $passwordMeter = $("#password-meter");

$("#toggle-password-signup").on("click", () => {
  const isPassword = $password.attr("type") === "password";
  $password.attr("type", isPassword ? "text" : "password");
  $("#toggle-password-signup").text(isPassword ? "Hide" : "Show");
});

$password.on("input", () => {
  const { checks } = validatePasswordStrength($password.val());
  const passedChecks = Object.entries(checks).filter(([, passed]) => passed).length;
  const percentage = (passedChecks / 5) * 100;
  $passwordMeter.css("width", `${percentage}%`);
  $passwordMeter.removeClass("bg-red-600 bg-amber bg-green-600");
  if (percentage <= 40) $passwordMeter.addClass("bg-red-600");
  else if (percentage <= 80) $passwordMeter.addClass("bg-amber");
  else $passwordMeter.addClass("bg-green-600");
  $passwordStrength.text(`Password strength: ${passedChecks}/5 checks passed`);
});

$("#signup-form").on("submit", async (event) => {
  event.preventDefault();

  const full_name = $("#full_name").val().trim();
  const email = $("#email").val().trim();
  const password = $("#password").val();
  const confirmPassword = $("#confirm_password").val();

  if (!validateRequired(full_name) || !validateEmail(email)) {
    showError("Please provide valid full name and email.");
    return;
  }

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    showError("Password must include uppercase, lowercase, number, special character, and 8+ length.");
    return;
  }
  if (password !== confirmPassword) {
    showError("Passwords do not match.");
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
