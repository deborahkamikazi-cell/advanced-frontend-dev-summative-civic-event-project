let pendingConfirmCallback = null;

function getToastContainer() {
  return $("#global-toasts");
}

function showToast(message, variant = "success") {
  const variantClasses = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-navy"
  };
  const toastClass = variantClasses[variant] || variantClasses.info;
  const $container = getToastContainer();

  if (!$container.length) {
    window.alert(message);
    return;
  }

  const $toast = $(`<div class="${toastClass} rounded-lg px-4 py-2 text-sm text-white shadow-lg">${message}</div>`);
  $container.append($toast);
  setTimeout(() => {
    $toast.fadeOut(200, () => $toast.remove());
  }, 2600);
}

export function showSuccess(message) {
  showToast(message, "success");
}

export function showError(message) {
  showToast(message, "error");
}

export function showInfo(message) {
  showToast(message, "info");
}

export function openConfirmModal({
  title = "Confirm action",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  onConfirm = () => {}
} = {}) {
  const $overlay = $("#global-modal-overlay");
  if (!$overlay.length) {
    const shouldProceed = window.confirm(message);
    if (shouldProceed) onConfirm();
    return;
  }

  $("#global-modal-title").text(title);
  $("#global-modal-message").text(message);
  $("#global-modal-confirm").text(confirmLabel);
  pendingConfirmCallback = onConfirm;
  $overlay.removeClass("hidden");
}

export function closeConfirmModal() {
  pendingConfirmCallback = null;
  $("#global-modal-overlay").addClass("hidden");
}

$(document).off("click.modal-ui");
$(document).on("click.modal-ui", "#global-modal-cancel", closeConfirmModal);
$(document).on("click.modal-ui", "#global-modal-overlay", (event) => {
  if (event.target.id === "global-modal-overlay") {
    closeConfirmModal();
  }
});
$(document).on("click.modal-ui", "#global-modal-confirm", () => {
  if (typeof pendingConfirmCallback === "function") {
    pendingConfirmCallback();
  }
  closeConfirmModal();
});
