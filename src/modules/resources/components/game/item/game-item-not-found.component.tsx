import React, { Fragment } from 'react';

type Props = {
    itemId: number | string;
};

export const GameItemNotFound = React.memo((props: Props) => (
    <Fragment>
        {`Item '${props.itemId}' could not be found.`}
    </Fragment>
));
