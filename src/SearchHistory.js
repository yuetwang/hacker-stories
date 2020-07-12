import React from 'react';

const SearchHistory = ({lastSearches, onLastSearch}) => (
    <>
    {
        lastSearches.map((searchTerm, index) => (
            <button
                key={searchTerm + index}
                type="button"
                class="button button_small"
                onClick={() => onLastSearch(searchTerm)}
            >
                {searchTerm}
            </button>
        ))
    }
    </>
)

export default SearchHistory;
