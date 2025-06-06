function applyPlansSettings(fragment, locale) {
    fragment.settings = {};
    if (fragment?.fields?.showSecureLabel !== false) {
        fragment.settings.secureLabel = '{{secure-label}}';
    }
    if (fragment?.fields?.showPlanType != null) {
        fragment.settings.displayPlanType = fragment?.fields?.showPlanType;
    }
    if (locale === 'en_US') {
        fragment.settings.displayPlanType ??= true;
    }
}

async function settings(context) {
    const { locale } = context;
    if (context.body?.fields?.variant?.startsWith('plans')) {
        applyPlansSettings(context.body, locale);
    }

    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (
                ref &&
                ref.type === 'content-fragment' &&
                ref.value?.fields?.variant?.startsWith('plans')
            ) {
                applyPlansSettings(ref.value, locale);
            }
        });
    }
    return context;
}

exports.settings = settings;
