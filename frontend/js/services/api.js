import { APP_CONFIG } from "../config/config.js";
import { clearSession, getToken } from "../utils/storage.js";
import { showError } from "../utils/notifications.js";

function buildAjaxConfig({ method, endpoint, data, requiresAuth = true }) {
  const token = getToken();
  const isFormData = data instanceof FormData;
  const config = {
    url: `${APP_CONFIG.API_BASE_URL}${endpoint}`,
    method,
    dataType: "json",
    timeout: 20000
  };

  if (requiresAuth && token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }

  if (data !== undefined && data !== null) {
    if (isFormData) {
      config.data = data;
      config.processData = false;
      config.contentType = false;
    } else if (method.toUpperCase() === "GET") {
      config.data = data;
    } else {
      config.data = JSON.stringify(data);
      config.contentType = "application/json";
    }
  }

  return config;
}

function normalizeError(jqXHR, textStatus) {
  const fallbackMessage = textStatus === "timeout" ? "Request timed out. Please try again." : "Request failed.";
  const payload = jqXHR.responseJSON || {};
  return {
    status: jqXHR.status || 0,
    message: payload.message || fallbackMessage,
    errors: payload.errors || []
  };
}

function handleGlobalHttpErrors(error) {
  if (error.status === 401) {
    clearSession();
    window.location.href = APP_CONFIG.LOGIN_PAGE;
    return;
  }

  if (error.status === 403) {
    showError("Access denied: you do not have permission to perform this action.");
    return;
  }
}

export function request({ method = "GET", endpoint, data, requiresAuth = true }) {
  const ajaxConfig = buildAjaxConfig({ method, endpoint, data, requiresAuth });

  return new Promise((resolve, reject) => {
    $.ajax(ajaxConfig)
      .done((response) => resolve(response))
      .fail((jqXHR, textStatus) => {
        const error = normalizeError(jqXHR, textStatus);
        handleGlobalHttpErrors(error);
        reject(error);
      });
  });
}
