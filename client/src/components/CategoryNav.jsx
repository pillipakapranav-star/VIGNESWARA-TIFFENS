import React from 'react';

export default function CategoryNav({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="category-scroll-wrapper">
      <div className="category-pills">
        <button
          className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
        >
          <span>🌟</span>
          <span>All Items</span>
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span>{cat.icon || '🍱'}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
