import { ignore } from './external.js';

// some referenced @pandora modules import `react`
// but it never activates from this package
// and can be mocked to decrease size of the resulting bundle

const React = ignore;
const useContext = ignore;
const useMemo = ignore;

export default React;
export { useContext, useMemo };
