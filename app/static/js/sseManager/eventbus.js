class EventBus extends EventTarget {
  on(event, listener) {
    this.addEventListener(event, listener);
  }

  off(event, listener) {
    this.removeEventListener(event, listener);
  }

  emit(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
}

export default new EventBus();
