import { HttpOptions, HttpResponseError, HttpResponseType, Nullable } from '../types/internal';
import { JwtUtils } from './jwt.utils';
import { SubscribablesContainer } from './subscription/subscribables-container';
import { SubscriptionTopic } from './subscription/subscription-topic';

type RequestBody = string | Record<string, unknown>;

export class HttpUtils {

    private static readonly _AuthorizationHeader = 'Authorization';

    private static readonly _ContentTypeHeader = 'Content-Type';

    private static get _onUnauthorized() {
        return SubscribablesContainer.get(SubscriptionTopic.User_Unauthorized);
    }

    static async get<T = any>(url: string, options?: HttpOptions): Promise<T> {
        if (options?.params) {
            url += `&${this._generateUrlParamsString(options.params)}`;
        }
        const headers = this._appendAuthorizationHeader();
        const init = {
            method: 'GET',
            credentials: 'include',
            headers
        } as RequestInit;
        const response = await this._fetch(url, init);
        return this._parseResponseBody(response, options) as any;
    }

    static async post<T = any>(url: string, body: RequestBody, options?: HttpOptions): Promise<T> {
        if (options?.params) {
            url += `&${this._generateUrlParamsString(options.params)}`;
        }
        const headers = {
            [this._ContentTypeHeader]: this._inferContentType(body)
        };
        this._appendAuthorizationHeader(headers);
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        const init = {
            method: 'POST',
            credentials: 'include',
            body,
            headers
        } as RequestInit;
        const response = await this._fetch(url, init);
        return this._parseResponseBody(response, options) as any;
    }

    static async put<T = any>(url: string, body: RequestBody, options?: HttpOptions): Promise<T> {
        if (options?.params) {
            url += `&${this._generateUrlParamsString(options.params)}`;
        }
        const headers = {
            [this._ContentTypeHeader]: this._inferContentType(body)
        };
        this._appendAuthorizationHeader(headers);
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        const init = {
            method: 'PUT',
            credentials: 'include',
            body,
            headers
        } as RequestInit;
        const response = await this._fetch(url, init);
        return this._parseResponseBody(response, options) as any;
    }

    static async delete<T = any>(url: string, options?: HttpOptions): Promise<T> {
        if (options?.params) {
            url += `&${this._generateUrlParamsString(options.params)}`;
        }
        const headers = this._appendAuthorizationHeader();
        const init = {
            method: 'DELETE',
            credentials: 'include',
            headers
        } as RequestInit;
        const response = await this._fetch(url, init);
        return this._parseResponseBody(response, options) as any;
    }

    private static _inferContentType(body: RequestBody): string {
        if (typeof body === 'object') {
            return 'application/json';
        }
        return 'text/plain';
    }

    private static _appendAuthorizationHeader(headers: Record<string, string> = {}): Record<string, string> {
        const token = JwtUtils.readTokenFromStorage();
        if (token !== null) {
            headers[this._AuthorizationHeader] = token;
        }
        return headers;
    }

    private static _generateUrlParamsString(params: Record<string, Nullable<string | number | boolean>>): string {
        const urlParams = new URLSearchParams();
        for (const key in params) {
            let value = params[key];
            if (value == null) {
                continue;
            }
            if (typeof value !== 'string') {
                value = String(value);
            }
            urlParams.append(key, value);
        }
        return urlParams.toString();
    }

    private static async _fetch(url: string, init: RequestInit): Promise<Response> {
        try {
            return await fetch(url, init);
        } catch (e: any) {
            // TODO Handle fetch error here.
            throw e;
        }
    }

    private static async _parseResponseBody(response: Response, options: HttpOptions = {}): Promise<string | Record<string, any>> {
        const contentType = response.headers.get(this._ContentTypeHeader);
        const { responseType, ignoreUnauthorized } = options;
        let inferredResponseType: HttpResponseType;
        if (response.ok && responseType) {
            inferredResponseType = responseType;
        } else if (contentType?.includes('json')) {
            inferredResponseType = 'json';
        } else {
            inferredResponseType = 'text';
        }
        if (!response.ok) {
            const error = await this._parseResponseError(response, inferredResponseType);
            if (this._isUnauthorizedError(error) && !ignoreUnauthorized) {
                this._notifyUnauthorizedError(error);
            }
            throw error;
        }
        return this._getResponseBody(response, inferredResponseType);
    }

    private static async _getResponseBody(response: Response, responseType: HttpResponseType): Promise<string | Record<string, any>> {
        if (responseType === 'text') {
            return response.text();
        }
        // TODO Fallback to text if json fails.
        return response.json();
    }

    private static async _parseResponseError(response: Response, responseType: HttpResponseType): Promise<HttpResponseError> {
        const body = await this._getResponseBody(response, responseType);
        const message = typeof body === 'string' ? body : body['message'];

        return {
            status: response.status,
            statusText: response.statusText,
            message,
        };
    }

    private static _isUnauthorizedError({ status }: HttpResponseError): boolean {
        return status === 401 || status === 403;
    }

    private static _notifyUnauthorizedError(error: HttpResponseError): void {
        this._onUnauthorized.next(error);
    }

}
