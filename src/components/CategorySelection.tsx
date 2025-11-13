import type { CategoryKey } from "../types";
import { categories } from "../constants";

interface CategorySelectionProps {
  onSelectCategory: (category: CategoryKey) => void;
}

export const CategorySelection = ({ onSelectCategory }: CategorySelectionProps) => {
  return (
    <section className="category-selection">
      <header className="section-header">
        <h1>n8n Agent Assistant</h1>
        <p>Select a category to start chatting with a specialized agent.</p>
      </header>
      <div className="category-grid">
        {categories.map((category) => (
          <article key={category.key} className="category-card">
            <div className="card-body">
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => onSelectCategory(category.key)}
            >
              Start Chat
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
