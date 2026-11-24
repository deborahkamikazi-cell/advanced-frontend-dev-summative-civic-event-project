const PASSWORD_STRENGTH_REGEX = {
  minLength: /.{8,}/,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[\W_]/
};

export function validatePasswordStrength(password) {
  const checks = {
    minLength: PASSWORD_STRENGTH_REGEX.minLength.test(password),
    hasUppercase: PASSWORD_STRENGTH_REGEX.hasUppercase.test(password),
    hasLowercase: PASSWORD_STRENGTH_REGEX.hasLowercase.test(password),
    hasNumber: PASSWORD_STRENGTH_REGEX.hasNumber.test(password),
    hasSpecial: PASSWORD_STRENGTH_REGEX.hasSpecial.test(password)
  };

  const isValid = Object.values(checks).every(Boolean);
  return { isValid, checks };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(value) {
  return String(value || "").trim().length > 0;
}

export function validateFile(file, allowedExtensions = [], maxFileSizeBytes = 0) {
  if (!file) return { isValid: false, message: "File is required." };

  const ext = file.name.split(".").pop().toLowerCase();
  if (allowedExtensions.length && !allowedExtensions.includes(ext)) {
    return { isValid: false, message: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}` };
  }

  if (maxFileSizeBytes > 0 && file.size > maxFileSizeBytes) {
    return { isValid: false, message: `File size must be <= ${Math.round(maxFileSizeBytes / (1024 * 1024))}MB.` };
  }

  return { isValid: true, message: "" };
}
