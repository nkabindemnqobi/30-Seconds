export default function importStylesheet(shadowRoot, url) {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", url);
  shadowRoot.appendChild(link);
}
