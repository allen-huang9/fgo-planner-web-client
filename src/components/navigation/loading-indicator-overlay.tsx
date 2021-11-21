import React, { PureComponent, ReactNode } from 'react';
import { Subscription } from 'rxjs';
import { LoadingIndicatorOverlayService } from '../../services/user-interface/loading-indicator-overlay.service';
import { LoadingIndicator } from '../loading-indicator.component';

type Props = {

};

type State = {
    show: boolean;
};

// TODO Convert this to functional component
export class LoadingIndicatorOverlay extends PureComponent<Props, State> {

    private _onDisplayStatusChangeSubscription!: Subscription;

    constructor(props: Props) {
        super(props);

        this.state = {
            show: false
        };
    }

    componentDidMount(): void {
        this._onDisplayStatusChangeSubscription = LoadingIndicatorOverlayService.onDisplayStatusChange
            .subscribe(show => this.setState({ show }));
    }

    componentWillUnmount(): void {
        this._onDisplayStatusChangeSubscription.unsubscribe();
    }

    render(): ReactNode {
        const { show } = this.state;
        return <LoadingIndicator show={show} />;
    }

}