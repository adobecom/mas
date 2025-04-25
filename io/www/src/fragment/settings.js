function applyPlansSettings(fragment, locale) {
    fragment.settings = {
        stockCheckboxLabel: '{{stock-checkbox-label}}',
        stockOfferOsis: '',
    };
    if (locale === 'en_US') {
        fragment.settings.displayPlanType = true;
    }
    if (fragment?.fields?.showSecureLabel !== false) {
        fragment.settings.secureLabel = '{{secure-label}}';
    }
}

async function settings(context) {
    const { locale } = context;
    if (context.body?.fields?.variant === 'plans') {
        applyPlansSettings(context.body, locale);
    }

    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (
                ref &&
                ref.type === 'content-fragment' &&
                ref.value?.fields?.variant === 'plans'
            ) {
                applyPlansSettings(ref.value, locale);
            }
        });
    }
    return context;
}

exports.settings = settings;
