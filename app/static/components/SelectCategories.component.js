import "./ListItems.component.js";
import CategoriesService from "../../services/categories.service.js";

export default class SelectCategories extends HTMLElement {
  constructor() {
    super();
    this.categoryService = new CategoriesService();
    this.categories = [];
    this.attachShadow({ mode: "open" });
    this.selectedCategories = [];
  }

  async connectedCallback() {
    this.categories = await this.categoryService.retrieveCategories();
    this.render();
  }

  render() {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = "Categories";
    fieldset.appendChild(legend);

    const categoriesContainer = document.createElement("div");
    categoriesContainer.classList.add("categories");

    this.categories.forEach((category) => {
      const chip = document.createElement("app-list");
      chip.setAttribute("id", category.id);
      chip.setAttribute("label", category.name);
      categoriesContainer.appendChild(chip);

      chip.addEventListener("selected", (event) =>
        this.onCategorySelected(event)
      );
    });

    fieldset.appendChild(categoriesContainer);
    const small = document.createElement("small");
    small.textContent = "All categories will be included";
    fieldset.appendChild(small);

    const style = document.createElement("style");
    style.textContent = `
      .categories {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
        margin: 10px 0;
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
      .category-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        padding: 0;
        list-style: none;
        max-width: 400px;
        margin: 2rem auto;
      }

      .category-list li {
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background-color: #fff;
        color: #374151;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s;
      }

      .category-list li:hover {
        background-color: #f5f3ff;
      }

      .category-list li.selected {
        background-color: #f3e8ff;
        border-color: #d8b4fe;
        color: #6b21a8;
      }
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(fieldset);
  }

  onCategorySelected(event) {
    const { label } = event.detail;

    const selectedCategory = this.categories.find(
      (category) => category.name === label
    );

    if (
      selectedCategory &&
      this.selectedCategories.includes(selectedCategory.id)
    ) {
      this.selectedCategories = this.selectedCategories.filter(
        (categoryId) => categoryId !== selectedCategory.id
      );
    } else {
      this.selectedCategories.push(selectedCategory.id);
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
