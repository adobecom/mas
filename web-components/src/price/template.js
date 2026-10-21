import { createLog } from '../log.js';
import { formatLiteral as renderLiteral } from '../../../price/src/price/template.js';

export {
    defaultLiterals,
    renderSpan,
} from '../../../price/src/price/template.js';

const log = createLog('ConsonantTemplates/price');

export const formatLiteral = (literals, locale, key, parameters) =>
    renderLiteral(literals, locale, key, parameters, log);
