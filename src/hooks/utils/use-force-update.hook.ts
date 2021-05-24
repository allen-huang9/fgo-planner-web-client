import { useState } from 'react';

export const useForceUpdate = (): () => void => {
    const [, setValue] = useState<number>(0);
    return () => setValue(value => value + 1);
};
