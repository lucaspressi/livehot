export function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key, defaultValue = null) {
  const item = localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export default { setItem, getItem, removeItem };
