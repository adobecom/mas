import { openAsDialog } from '@dexter/offer-selector-tool';

export const createLinkMarkup = (
    defaults,
    offerSelectorId,
    type,
    offer,
    options,
    promo,
) => {
    const isCta = !!type?.startsWith('checkout');

    const createHref = () => {
        const params = new URLSearchParams([
            ['osi', offerSelectorId],
            ['type', type],
        ]);
        if (promo) params.set('promo', promo);
        if (offer.commitment === 'PERPETUAL') params.set('perp', true);

        if (isCta) {
            const { workflow, workflowStep } = options;
            params.set('text', options.ctaText ?? DEFAULT_CTA_TEXT);
            if (workflow && workflow !== defaults.checkoutWorkflow) {
                params.set('workflow', workflow);
            }
            if (
                workflowStep &&
                workflowStep !== defaults.checkoutWorkflowStep
            ) {
                params.set('workflowStep', workflowStep);
            }
        } else {
            const {
                displayRecurrence,
                displayPerUnit,
                displayTax,
                displayOldPrice,
                forceTaxExclusive,
            } = options;
            updateParams(params, 'term', displayRecurrence);
            updateParams(params, 'seat', displayPerUnit);
            updateParams(params, 'tax', displayTax);
            updateParams(params, 'old', displayOldPrice);
            updateParams(params, 'exclusive', forceTaxExclusive);
        }
        return `https://milo.adobe.com/tools/ost?${params.toString()}`;
    };

    if (isCta) {
        const cta = document.createElement('a', { is: 'checkout-link' });
        cta.setAttribute('data-checkout-workflow', options.workflow);
        cta.setAttribute(
            'data-checkout-workflow-step',
            options.workflowStep ?? 'segmentation',
        );
        cta.setAttribute('data-promotion-code', promo ?? '');
        cta.setAttribute('data-quantity', '1');
        cta.setAttribute('data-wcs-osi', offerSelectorId);

        cta.href = createHref();

        const span = document.createElement('span');
        span.textContent = options.ctaText ?? 'buy-now';
        cta.appendChild(span);

        return cta;
    } else {
        const inlinePrice = document.createElement('span', {
            is: 'inline-price',
        });
        inlinePrice.setAttribute(
            'data-display-per-unit',
            options.displayPerUnit ?? 'false',
        );
        inlinePrice.setAttribute(
            'data-quantity',
            offer.ordering.max_quantity ?? '1',
        );
        inlinePrice.setAttribute('data-template', 'price');
        inlinePrice.setAttribute('data-wcs-osi', offerSelectorId);
        return inlinePrice;
    }
};

export { openAsDialog };
