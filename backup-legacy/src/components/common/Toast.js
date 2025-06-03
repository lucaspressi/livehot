export function showToast(message, { type = 'info', duration = 3000 } = {}) {
  const containerId = 'toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  const base = 'px-4 py-2 rounded shadow text-white transition-opacity duration-300';
  let color = 'bg-blue-600';
  if (type === 'error') color = 'bg-red-600';
  else if (type === 'success') color = 'bg-green-600';
  toast.className = `${base} ${color}`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
