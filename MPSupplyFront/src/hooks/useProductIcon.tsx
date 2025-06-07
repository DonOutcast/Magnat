import React from 'react';

export const useProductIcon = (mp: string, size: string = '2') => {
    return <img className={'product-mp-icon mp-icon-size-' + size} src={`/assets/logo_${mp}.svg`} />;
};
