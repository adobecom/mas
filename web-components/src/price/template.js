import { createLog } from '../log.js';
import { formatLiteral as renderLiteral } from '@adobecom/mas-price/price/template';

export {
    defaultLiterals,
    renderSpan,
} from '@adobecom/mas-price/price/template';

const log = createLog('ConsonantTemplates/price');

export const formatLiteral = (literals, locale, key, parameters) =>
    renderLiteral(literals, locale, key, parameters, log);
