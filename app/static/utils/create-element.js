/**
 * Creates a DOM element with optional attributes, properties, and children.
 *
 * @param {string} tag 
 * @param {Object} [options] 
 * @param {Object} [options.attrs] 
 * @param {Object} [options.props] 
 * @param {HTMLElement[]|string[]} [options.children] 
 * @returns {HTMLElement}
 */
export function createElement(
  tag,
  { attrs = {}, props = {}, children = [] } = {}
) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }

  for (const [key, value] of Object.entries(props)) {
    el[key] = value;
  }

  for (const child of children) {
    el.append(
      typeof child === "string" ? document.createTextNode(child) : child
    );
  }

  return el;
}
