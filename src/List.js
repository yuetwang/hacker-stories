import React from 'react';
import { ReactComponent as Check } from './check.svg';

const List = ({ list, onRemoveItem }) =>
    
    list.map(item => (
        <Item
            key={item.objectID}
            item={item}
            onRemoveItem={onRemoveItem}
        />
    )
);

const Item = ({ item, onRemoveItem }) => {
    return (
        <div className="item">
            <span style={{width: '50%'}}>
                <a href={item.url}>{item.title}</a>
            </span>
            <span style={{width: '20%'}}>{item.author}</span>
            <span style={{width: '10%'}}>{item.num_comments}</span>
            <span style={{width: '10%'}}>{item.points}</span>
            <span style={{width: '10%'}}>
                <button 
                    type="button" 
                    onClick={() => onRemoveItem(item)}
                    className="button button_small"
                >
                    <Check height="18px" width="18px"/>
        </button>
            </span>
        </div>
    )
};

export default List;
