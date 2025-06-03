export function createButton({ text = 'Button', onClick, className = '' } = {}) {
  const btn = document.createElement('button');
  btn.textContent = text;
  if (className) btn.className = className;
  if (typeof onClick === 'function') {
    btn.addEventListener('click', onClick);
  }
  return btn;
}
