import CategoriesService from "../../services/categories.service.js";
import "./Error.component.js";
import "./ListItems.component.js";

export default class SelectCategories extends HTMLElement {
  constructor() {
    super();
    this.categoryService = new CategoriesService();
    this.categories = [];
    this.selectedCategories = [];
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    try {
      this.categories = await this.categoryService.retrieveCategories();
      if (this.categories.length === 0) {
        this.renderError("No categories available. Please try again.");
        return;
      }
      this.render();
    } catch (error) {
      this.renderError("Failed to load categories. Please try again.");
    }
  }

  render() {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = "Categories";
    fieldset.appendChild(legend);

    const categoriesContainer = document.createElement("ul");
    categoriesContainer.classList.add("categories");
    categoriesContainer.setAttribute("role", "list");

    this.categories.forEach((category) => {
      const chip = document.createElement("app-list");
      chip.setAttribute("id", category.id);
      chip.setAttribute("label", category.name);

      // If already selected (in case of re-render), mark it visually
      if (this.selectedCategories.includes(category.id)) {
        chip.classList.add("selected");
      }

      chip.addEventListener("selected", (event) =>
        this.onCategorySelected(event, chip)
      );

      categoriesContainer.appendChild(chip);
    });

    fieldset.appendChild(categoriesContainer);

    const small = document.createElement("small");
    small.textContent = "All categories will be included";
    fieldset.appendChild(small);

    const style = document.createElement("style");
    style.textContent = `

      .categories {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        list-style: none;
        padding: 0;
        margin: 0;
      }
        @media (max-width: 400px) {
        .categories {
          grid-template-columns: 1fr;
        }
      }

      app-list {
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background-color: #fff;
        color: #374151;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
      }

      app-list:hover {
        background-color: #f5f3ff;
      }

      app-list.selected {
        background-color: #f3e8ff;
        border-color: #d8b4fe;
        color: #6b21a8;
      }

      fieldset {
        border: 2px solid #e5e7eb;
        padding: 16px;
        border-radius: 0.375rem;
      }

      legend {
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 12px;
      }

      small {
        display: block;
        margin-top: 10px;
        color: #666;
      }
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(fieldset);
  }

  renderError(message) {
    const errorMessage = document.createElement("error-message");
    errorMessage.setAttribute("message", message);
    errorMessage.setAttribute("retry", "");

    errorMessage.addEventListener("retry", () => this.connectedCallback());

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(errorMessage);
  }

  onCategorySelected(event, chip) {
    const { label } = event.detail;

    const selectedCategory = this.categories.find(
      (category) => category.name === label
    );

    if (!selectedCategory) return;

    const isSelected = this.selectedCategories.includes(selectedCategory.id);

    if (isSelected) {
      this.selectedCategories = this.selectedCategories.filter(
        (categoryId) => categoryId !== selectedCategory.id
      );
      chip.classList.remove("selected");
    } else {
      this.selectedCategories.push(selectedCategory.id);
      chip.classList.add("selected");
    }

    this.dispatchEvent(
      new CustomEvent("updated", {
        detail: this.selectedCategories,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("select-categories", SelectCategories);
