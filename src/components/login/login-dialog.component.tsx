import { Button, Dialog, DialogActions, DialogContent, DialogTitle, StyleRules, TextField, Theme, Typography, withStyles } from '@material-ui/core';
import { WithStylesOptions } from '@material-ui/core/styles/withStyles';
import { Formik, FormikConfig, FormikProps } from 'formik';
import React, { ReactNode } from 'react';
import { Container as Injectables } from 'typedi';
import * as Yup from 'yup';
import { AuthService } from '../../services/authentication/auth.service';
import { ModalComponentProps, UserCredentials, WithStylesProps } from '../../types';
import { FormUtils } from '../../utils/form.utils';
import { ModalComponent } from '../base/modal-component';
import { InputFieldContainer } from '../input-field-container.component';

type Props = ModalComponentProps & WithStylesProps;

type State = {
    isLoggingIn: boolean;
    errorMessage?: string | null;
};

const style = (theme: Theme) => ({
    form: {
        padding: theme.spacing(4, 2, 0, 2)
    },
    inputFieldContainer: {
        width: '256px'
    }
} as StyleRules);

const styleOptions: WithStylesOptions<Theme> = {
    classNamePrefix: 'LoginDialog'
};

export const LoginDialog = withStyles(style, styleOptions)(class extends ModalComponent<Props, State> {

    private readonly _formId = 'login-form';

    private readonly _validationSchema = Yup.object().shape({
        username: Yup.string().required('Username cannot be blank'),
        password: Yup.string().required('Password cannot be blank')
    });

    private readonly _formikConfig: FormikConfig<UserCredentials> = {
        initialValues: {
            username: '',
            password: ''
        },
        onSubmit: this._login.bind(this),
        validationSchema: this._validationSchema,
        validateOnBlur: true
    };

    private _authService = Injectables.get(AuthService);

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoggingIn: false
        };

        this._renderForm= this._renderForm.bind(this);
        this._login = this._login.bind(this);
        this._cancel = this._cancel.bind(this);
    }

    render(): ReactNode {
        const { classes, ...dialogProps } = this.props;
        const { isLoggingIn, errorMessage } = this.state;
        return (
            <Dialog {...dialogProps}>
                <Typography component={'div'}>
                    <DialogTitle>
                        Login
                    </DialogTitle>
                    <DialogContent>
                        <div>
                            {errorMessage}
                        </div>
                        <Formik {...this._formikConfig}>
                            {this._renderForm}
                        </Formik>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained"
                                color="secondary" 
                                onClick={this._cancel}>
                            Close
                        </Button>
                        <Button variant="contained"
                                color="primary"
                                form={this._formId}
                                type="submit"
                                disabled={isLoggingIn}>
                            Login
                        </Button>
                    </DialogActions>
                </Typography>
            </Dialog>
        );
    }

    private _renderForm(props: FormikProps<UserCredentials>): ReactNode {
        const { classes } = this.props;
        
        const { 
            values, 
            errors, 
            touched, 
            handleBlur,
            handleChange, 
            handleSubmit 
        } = props;
        
        const touchedErrors = FormUtils.getErrorsForTouchedFields(errors, touched);

        return (
            <form className={classes.form} 
                  id={this._formId} 
                  noValidate
                  onSubmit={e => { e.preventDefault(); handleSubmit(e); }}
            >
                <InputFieldContainer className={classes.inputFieldContainer}>
                    <TextField variant="outlined"
                               fullWidth
                               label="Username"
                               id="username"
                               name="username"
                               value={values.username}
                               onChange={handleChange}
                               onBlur={handleBlur}
                               error={!!touchedErrors.username}
                               helperText={touchedErrors.username}
                    />
                </InputFieldContainer>
                <InputFieldContainer className={classes.inputFieldContainer}>
                    <TextField variant="outlined"
                               fullWidth
                               label="Password"
                               id="password"
                               name="password"
                               type="password"
                               value={values.password}
                               onChange={handleChange}
                               onBlur={handleBlur}
                               error={!!touchedErrors.password}
                               helperText={touchedErrors.password}
                    />
                </InputFieldContainer>
            </form>
        );
    }

    private async _login(values: UserCredentials): Promise<void> {
        this.setState({ 
            isLoggingIn: true,
            errorMessage: null
        });
        try {
            await this._authService.login(values);

            // Only update the state if the component is still mounted.
            if (this._isMounted) {
                this.setState({
                    isLoggingIn: false
                });
            }
            
            this.props.onClose({}, 'submit');
        } catch (e) {
            this.setState({
                isLoggingIn: false,
                errorMessage: String(e)
            });
        }
    }

    private _cancel(): void {
        this.props.onClose({}, 'cancel');
    }

});