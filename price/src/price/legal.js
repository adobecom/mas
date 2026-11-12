import { toBoolean } from '../helpers.js';
import { formatLiteral, makeSpacesAroundNonBreaking, renderSpan, taxLabelKey, toLocale } from './template.js';

/** Renders the per-unit, tax and plan type labels shown below a price. */
export function legalTemplate(context, { taxDisplay, taxTerm, planType }, logger = console) {
    const {
        country,
        language,
        displayPerUnit,
        displayTax,
        displayPlanType,
        customPlanTypeLabel,
        displayDot = true,
        planTypeCase,
        literals = {},
    } = context;
    const locale = toLocale(language, country);
    const label = (key, parameters) => formatLiteral(literals, locale, key, parameters, logger);
    const perUnitLabel = toBoolean(displayPerUnit) ? label('perUnitLabel', { perUnit: 'LICENSE' }) : '';
    let taxLabel = '';
    // US English prices never show the tax label.
    if (!(country === 'US' && language === 'en') && toBoolean(displayTax) && taxTerm) {
        taxLabel = label(taxLabelKey(taxDisplay), { taxTerm });
    }
    let planTypeLabel = '';
    if (toBoolean(displayPlanType)) {
        // Authored rich text (e.g. a card's Short Description) replaces the
        // derived wording for any plan type and is rendered as is.
        if (customPlanTypeLabel) planTypeLabel = customPlanTypeLabel;
        else if (planType) {
            planTypeLabel = label('planTypeLabel', { planType });
            if (planTypeLabel && planTypeCase) {
                const first = planTypeLabel[0];
                planTypeLabel = (planTypeCase === 'lower' ? first.toLowerCase() : first.toUpperCase()) + planTypeLabel.slice(1);
            }
        }
    }
    if (taxLabel && planTypeLabel && displayDot) taxLabel += taxLabel.endsWith('.') ? ' ' : '. ';
    return renderSpan(
        'price price-legal',
        renderSpan('price-unit-type', makeSpacesAroundNonBreaking(perUnitLabel)) +
            renderSpan('price-tax-inclusivity', taxLabel) +
            renderSpan('price-plan-type', planTypeLabel),
    );
}
