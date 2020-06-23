import React from 'react';
import axios from 'axios';

import SearchForm from './SearchForm';
import List from './List';

import './App.css';


const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

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
                data: action.payload
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

const App = () => {

    const [searchTerm, setSearchTerm] = useSemiPersistentState(
        'search',
        'React'
    );

    const [url, setUrl] = React.useState(
        `${API_ENDPOINT}${searchTerm}`
    );

    const [stories, dispatchStories] = React.useReducer(
        storiesReducer,
        {
            data: [], 
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
            const result = await axios.get(url);
            dispatchStories({
                type: 'STORIES_FETCH_SUCCESS',
                payload: result.data.hits
            });
        } catch {
            dispatchStories({type: 'STORIES_FETCH_FAILURE'});
        }
    }, [url]);

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

    const handleSearchSubmit = event => {
        setUrl(`${API_ENDPOINT}${searchTerm}`);
        event.preventDefault();
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

            {stories.isError && <p>Something went wrong ...</p>}
            {stories.isLoading ? (
                <p>Loading ...</p>
            ) : (
                <List
                    list={stories.data}
                    onRemoveItem={handleRemoveStory}
                />
                )}
        </div>
    );
}


export default App;
