import CategoriesService from "../../services/categories.service.js";
import "./Error.component.js"; 
import "./ListItems.component.js"

export default class SelectCategories extends HTMLElement {
  constructor() {
    super();
    this.categoryService = new CategoriesService();
    this.categories = [];
    this.attachShadow({ mode: "open" });
    this.selectedCategories = [];
  }

  async connectedCallback() {
    try {
    this.categories = await this.categoryService.retrieveCategories();
      if (this.categories.length === 0) {
        this.renderError("No categories available. Please try again.");
        return;
      }
      console.log(this.categories)
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
         grid-template-columns: repeat(2, 1fr); 
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
    
    this.shadowRoot.innerHTML = ""; // Clear existing content
    this.shadowRoot.appendChild(errorMessage); // Append error message component
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