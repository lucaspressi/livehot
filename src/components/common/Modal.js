export default class Modal {
  constructor({ content, className = '' } = {}) {
    this.overlay = document.createElement('div');
    this.overlay.className = `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${className}`;
    this.overlay.style.display = 'none';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    this.content = document.createElement('div');
    this.content.className = 'bg-white p-4 rounded';
    if (content instanceof HTMLElement) {
      this.content.appendChild(content);
    } else if (typeof content === 'string') {
      this.content.innerHTML = content;
    }
    this.overlay.appendChild(this.content);
    document.body.appendChild(this.overlay);
  }

  show() {
    this.overlay.style.display = 'flex';
  }

  hide() {
    this.overlay.style.display = 'none';
  }

  remove() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
