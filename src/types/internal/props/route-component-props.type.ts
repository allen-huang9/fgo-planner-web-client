import { RouteComponentProps as ReactRouteComponentProps } from 'react-router-dom';
import { RouteDefinition } from '../route/route-definition.type';

export type RouteComponentProps = {
    route?: RouteDefinition;
    parentPath?: string;
} & Partial<ReactRouteComponentProps>;
