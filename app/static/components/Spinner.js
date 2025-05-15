const spinnerHTML = `
  <style>
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #007bff;
      animation: spin 1s linear infinite;
      margin: 10px auto;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
  <div class="spinner"></div>
`;

const parser = new DOMParser();
const doc = parser.parseFromString(`<template>${spinnerHTML}</template>`, "text/html");
const template = doc.querySelector("template");

class Spinner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('loading-spinner', Spinner);
