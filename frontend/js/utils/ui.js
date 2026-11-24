import { showError } from "./notifications.js";

export function setLoadingState(targetSelector, isLoading, message = "Loading...") {
  const $target = $(targetSelector);
  if (!$target.length) return;

  if (isLoading) {
    $target.html(`<div class="p-4 text-sm text-gray-600" role="status">${message}</div>`);
  }
}

export function setEmptyState(targetSelector, message = "No data found.") {
  const $target = $(targetSelector);
  if (!$target.length) return;
  $target.html(`<div class="p-4 text-sm text-gray-500">${message}</div>`);
}

export function setErrorState(targetSelector, message = "An error occurred.") {
  const $target = $(targetSelector);
  if (!$target.length) return;
  $target.html(`<div class="p-4 text-sm text-red-600">${message}</div>`);
}

export function loadComponent(targetSelector, componentPath) {
  const $target = $(targetSelector);
  if (!$target.length) return Promise.resolve();

  return new Promise((resolve, reject) => {
    $target.load(componentPath, (response, status, xhr) => {
      if (status === "error") {
        const message = `Failed to load component: ${componentPath}`;
        showError(message);
        reject(xhr);
        return;
      }
      resolve(response);
    });
  });
}
