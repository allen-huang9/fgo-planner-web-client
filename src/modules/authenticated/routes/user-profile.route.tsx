import React, { Fragment } from 'react';
import { PageTitle } from '../../../components/text/page-title.component';
import { UnderConstruction } from '../../../components/utils/under-construction.component';

export const UserProfileRoute = React.memo(() => (
    <Fragment>
        <PageTitle>User Profile</PageTitle>
        <UnderConstruction />
    </Fragment>
));
