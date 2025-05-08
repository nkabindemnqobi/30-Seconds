function importStylesheet(url, isShadowRoot = false, shadowRoot = null) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;

  // If isShadowRoot is true, append the <link> to the shadowRoot, otherwise to the main document
  if (isShadowRoot && shadowRoot) {
    shadowRoot.appendChild(link);  // Append to the shadow DOM
  } else {
    document.head.appendChild(link);  // Append to the main document's head
  }
}
