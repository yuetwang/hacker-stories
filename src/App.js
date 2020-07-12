import React from 'react';
import axios from 'axios';

import SearchForm from './SearchForm';
import List from './List';
import SearchHistory from './SearchHistory';

import './App.css';

const API_BASE = 'https://hn.algolia.com/api/v1';
const API_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';

const getUrl = (searchTerm, page) => {
    return `${API_BASE}${API_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}`;
}

// Custom hook to manage state and synchronizes with local storage
const useSemiPersistentState = (key, initialState) => {

    const [value, setValue] = React.useState(
        localStorage.getItem(key) || initialState
    );
    // useEffect() hook to trigger the side-effect 
    // It runs for the first time a component renders and then re-render when dependencies changes
    React.useEffect(() => {
        localStorage.setItem(key, value);
    }, [value, key]);
    return [value, setValue];
}

const storiesReducer = (state, action) => {
    switch (action.type) {
        case 'STORIES_FETCH_INIT':
            return {
                ...state,
                isLoading: true,
                isError: false
            };
        case 'STORIES_FETCH_SUCCESS': 
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: 
                    action.payload.page === 0 
                    ? action.payload.list
                    : state.data.concat(action.payload.list),
                page: action.payload.page
            };
        case 'STORIES_FETCH_FAILURE': 
            return {
                ...state,
                isLoading: false,
                isError: true
            };
        case 'REMOVE_STORY':
            return {
                ...state,
                data: state.data.filter(
                    story => action.payload.objectID !== story.objectID
                )
            };

        default:
            throw new Error();
    }
};

const getSumComments = stories => {
    return stories.data.reduce(
        (result, value) => result + value.num_comments,
        0
    );
};

const extractSearchTerm = url => 
    url.substring(url.lastIndexOf('?') + 1, url.lastIndexOf('&'))
    .replace(PARAM_SEARCH, '');

const getLastSearches = urls => 
    urls
    .reduce((result, url, index) => {
        const searchTerm = extractSearchTerm(url);

        if (index == 0) {
            return result.concat(searchTerm);
        }
        const previousSearchTerm = result[result.length - 1];
        if (searchTerm === previousSearchTerm) {
            return result;
        } else {
            return result.concat(searchTerm);
        }
    }, [])
    .slice(-6, -1);


const App = () => {

    const [searchTerm, setSearchTerm] = useSemiPersistentState(
        'search',
        'React'
    );

    const handleSearchSubmit = event => {
        handleSearch(searchTerm, 0);
        event.preventDefault();
    };

    const handleLastSearch = searchTerm => {
        setSearchTerm(searchTerm);
        handleSearch(searchTerm, 0);
    };

    const handleSearch = (searchTerm, page) => {
        const url = getUrl(searchTerm, page);
        setUrls(urls.concat(url));
    }

    const [urls, setUrls] = React.useState(
        [getUrl(searchTerm, 0)]
    );
    const lastSearches = getLastSearches(urls);

    const [stories, dispatchStories] = React.useReducer(
        storiesReducer,
        {
            data: [], 
            page: 0,
            isLoading: false,
            isError: false 
        }

    );

    // memoized handler based on top of handelers and callback handlers
    // searchTerm change -> handleFetchStories change -> side-effect run
    const handleFetchStories = React.useCallback(async () => {

        dispatchStories({type: 'STORIES_FETCH_INIT'});
        try {
            // use a third party library to as fetch might not work for old browsers or headless browser
            const lastUrl = urls[urls.length - 1];
            const result = await axios.get(lastUrl);
            dispatchStories({
                type: 'STORIES_FETCH_SUCCESS',
                payload: {
                    list: result.data.hits,
                    page: result.data.page
                }
            });
        } catch {
            dispatchStories({type: 'STORIES_FETCH_FAILURE'});
        }
    }, [urls]);

    React.useEffect(() => {
        handleFetchStories();
    }, [handleFetchStories]);

    const handleRemoveStory = item => {
        // telling the reducer what to do
        dispatchStories({
            type: 'REMOVE_STORY',
            payload: item
        })
    };

    // a callback handler: a callback function gets introduced, is used elsewhere
    // but 'call back' to the place it was introduced
    const handleSearchInput = event => {
        setSearchTerm(event.target.value);
    };

    const handleMore = () => {
        const lastUrl = urls[urls.length - 1];
        const searchTerm = extractSearchTerm(lastUrl);
        handleSearch(searchTerm, stories.page + 1);
    }

    const sumComments = React.useMemo(() => getSumComments(stories), [
        stories
    ]);

    return (
        <div className="container">
            <h1 className="headline-primary">My Hacker Stories with {sumComments} comments.</h1>
            <SearchForm
                searchTerm={searchTerm}
                onSearchInput={handleSearchInput}
                onSearchSubmit={handleSearchSubmit}
            />

            <SearchHistory
                lastSearches={lastSearches}
                onLastSearch={handleLastSearch}
            />
            
            <hr />

            {stories.isError && <p>Something went wrong ...</p>}
            <List
                list={stories.data}
                onRemoveItem={handleRemoveStory}
            />
            {stories.isLoading ? (
                <p>Loading ...</p>
            ) : (
                <button type="button" onClick={handleMore}>
                    More
                </button>
            )}
        </div>
    );
}


export default App;
