import { Nullable } from '../types';

export class StyleUtils {

    static appendClassNames(...classNames: Nullable<string | false>[]) {
        if (!classNames.length) {
            return '';
        }
        if (classNames.length === 1) {
            return classNames[0] || '';
        }
        let result = '';
        for (const className of classNames) {
            if (!className) {
                continue;
            }
            result += result.length ? ` ${className}` : className;
        }
        return result;
    }

}
