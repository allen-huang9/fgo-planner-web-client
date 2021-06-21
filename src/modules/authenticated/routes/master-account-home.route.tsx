import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

export const MasterAccountHomeRoute = React.memo(() => {
    return (
        <Fragment>
            Account HOME!
            <Link to="master/soundtracks">Soundtracks</Link>
        </Fragment>
    );
});
