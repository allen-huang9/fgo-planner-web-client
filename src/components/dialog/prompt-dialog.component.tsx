import { Button, ButtonProps, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, withWidth } from '@material-ui/core';
import React, { ReactNode } from 'react';
import { DialogComponentProps, Nullable } from '../../types';
import { DialogComponent } from '../base/dialog-component';
import { DialogCloseButton } from './dialog-close-button.component';

type RenderedProps = {
    title?: string;
    prompt?: string;
    cancelButtonLabel?: string;
    cancelButtonColor?: ButtonProps['color'];
    confirmButtonLabel?: string;
    confirmButtonColor?: ButtonProps['color'];
};

type Props = RenderedProps & Omit<DialogComponentProps, 'onExited'>;

/**
 * Generic dialog for displaying a simple prompt with an action button and a
 * cancel button.
 */
export const PromptDialog = withWidth()(class extends DialogComponent<Props> {

    /**
     * Snapshot of the styling and text props. This allows the dialog to keep
     * displaying the same contents while it is undergoing its exit transition,
     * even if the props were cleared by the parent component.
     */
    private _propsSnapshot: Nullable<RenderedProps>;

    constructor(props: Props) {
        super(props);

        this._handleOnExited = this._handleOnExited.bind(this);
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<{}>): boolean {
        /*
         * If the dialog is about to close, then take snapshot of the current props.
         * The snapshot will be cleared after the dialog has existed.
         */
        if (!nextProps.open && this.props.open) {
            const {
                title,
                prompt,
                cancelButtonLabel,
                cancelButtonColor,
                confirmButtonLabel,
                confirmButtonColor
            } = this.props;

            this._propsSnapshot = {
                title,
                prompt,
                cancelButtonLabel,
                cancelButtonColor,
                confirmButtonLabel,
                confirmButtonColor
            };
        }

        return super.shouldComponentUpdate(nextProps, nextState);
    }

    render(): ReactNode {

        const {
            classes,
            title,
            prompt,
            cancelButtonLabel,
            cancelButtonColor,
            confirmButtonLabel,
            confirmButtonColor,
            onClose,
            ...dialogProps
        } = {
            ...this.props,
            ...this._propsSnapshot
        };

        const {
            fullScreen,
            closeIconEnabled,
            actionButtonVariant
        } = this._computeFullScreenProps();

        const showTitle = title || closeIconEnabled;

        return (
            <Dialog
                {...dialogProps}
                fullScreen={fullScreen}
                onClose={onClose}
                onExited={this._handleOnExited}
            >
                {showTitle &&
                    <DialogTitle>
                        {title}
                        {closeIconEnabled && <DialogCloseButton onClick={e => onClose(e, 'cancel')} />}
                    </DialogTitle>
                }
                <DialogContent>
                    {prompt && <DialogContentText>{prompt}</DialogContentText>}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant={actionButtonVariant}
                        color={cancelButtonColor} 
                        onClick={e => onClose(e, 'cancel')}
                    >
                        {cancelButtonLabel || 'Cancel'}
                    </Button>
                    <Button 
                        variant={actionButtonVariant}
                        color={confirmButtonColor}
                        onClick={e => onClose(e, 'submit')}
                    >
                        {confirmButtonLabel || 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
 
    private _handleOnExited(): void {
        this._propsSnapshot = null;
    }

});
