export const publishedCards = [
    {
        name: 'CCD preview',
        fragmentId: '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
        variant: 'ccd-slice',
        spectrum: 'css',
        theme: 'darkest',
    },
    {
        name: 'Adobe Home preview',
        fragmentId: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
        variant: 'ah-try-buy-widget',
        spectrum: 'swc',
        theme: 'dark',
    },
    {
        name: 'Commerce preview',
        fragmentId: '8bd9c722-8b3c-4c65-b135-7f6a1b84f800',
        variant: 'fries',
        spectrum: 'swc',
        theme: 'light',
    },
];

export const unpublishedCard = {
    fragmentId: '2835f208-dfe9-41cb-b0fc-2917a39e0834',
    variant: 'ah-promoted-plans',
    spectrum: 'swc',
    theme: 'light',
    preview: 'on',
};

export const collectionPreview = {
    fragmentId: '4a466a3c-efa2-4406-ae47-93abd2167e27',
    contentType: 'merch-card-collection',
    variant: 'plans',
    spectrum: 'swc',
    theme: 'light',
};

export const sharedPreview = {
    ...publishedCards[0],
    selectedTheme: 'dark',
};
