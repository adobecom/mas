export const PRODUCT_FEED_FIELDS = {
    id: {
        label: 'Product ID',
        type: 'text',
        required: true,
        maxLength: 1000,
        editable: false,
        showInModal: true,
        tooltip: 'Unique identifier for this product. Auto-generated from fragment name.',
        placeholder: 'adobe-mas-creative-cloud-all-apps',
        description: 'Must be unique across all your products. Used for tracking and updates.',
    },
    title: {
        label: 'Title',
        type: 'text',
        required: true,
        maxLength: 150,
        editable: true,
        showInModal: true,
        tooltip: 'Product name as it will appear in ChatGPT search results (max 150 characters).',
        placeholder: 'Adobe Creative Cloud All Apps',
        description: 'Clear, concise product name. HTML tags will be automatically stripped.',
    },
    description: {
        label: 'Description',
        type: 'textarea',
        required: true,
        maxLength: 5000,
        editable: true,
        showInModal: true,
        tooltip: 'Detailed product description explaining features and benefits (max 5000 characters).',
        placeholder: 'Get access to 20+ creative apps including Photoshop, Illustrator, and Premiere Pro...',
        description: "Should help users understand what the product does and who it's for.",
    },
    link: {
        label: 'Product Link',
        type: 'url',
        required: true,
        maxLength: 2000,
        editable: true,
        showInModal: true,
        tooltip: 'Direct URL to the product page where users can learn more or purchase.',
        placeholder: 'https://www.adobe.com/products/creative-cloud/all-apps.html',
        description: 'Must be a valid HTTPS URL on adobe.com domain.',
    },
    image_link: {
        label: 'Image URL',
        type: 'url',
        required: false,
        maxLength: 2000,
        editable: true,
        showInModal: true,
        tooltip: 'URL to product image (HTTPS, JPG/PNG/GIF/WebP, max 16MB).',
        placeholder: 'https://www.adobe.com/content/dam/cc/icons/creative-cloud.svg',
        description: 'Product thumbnail shown in search results. Auto-extracted from card background or icon.',
    },
    price: {
        label: 'Price',
        type: 'currency',
        required: false,
        pattern: /^\d+(\.\d{2})?\s[A-Z]{3}$/,
        editable: true,
        showInModal: true,
        tooltip: 'Product price with currency code (e.g., "54.99 USD"). Auto-fetched from WCS offer.',
        placeholder: '54.99 USD',
        description: 'Format: [amount] [ISO 4217 currency code]. Resolved from WCS API via offer ID.',
    },
    availability: {
        label: 'Availability',
        type: 'select',
        required: false,
        options: ['in_stock', 'out_of_stock', 'preorder', 'backorder'],
        editable: true,
        showInModal: true,
        tooltip: 'Current stock status. Digital products are typically "in_stock".',
        placeholder: 'in_stock',
        description: 'Stock availability status for this product.',
    },
    inventory_quantity: {
        label: 'Inventory Quantity',
        type: 'integer',
        required: false,
        min: 0,
        editable: true,
        showInModal: true,
        tooltip: 'Available units in stock. Set to 999999 for unlimited digital products.',
        placeholder: '999999',
        description: 'Number of units available. Digital products use 999999 to indicate unlimited.',
    },
    product_category: {
        label: 'Product Category',
        type: 'text',
        required: false,
        maxLength: 750,
        editable: true,
        showInModal: true,
        tooltip: 'Product categorization using " > " separator (e.g., "Software > Creative Software").',
        placeholder: 'Software > Creative Software > Subscription Plans',
        description: 'Hierarchical category path. Auto-mapped from card variant.',
    },
    brand: {
        label: 'Brand',
        type: 'text',
        required: false,
        maxLength: 70,
        editable: true,
        showInModal: false,
        tooltip: 'Product brand name (max 70 characters).',
        placeholder: 'Adobe',
        description: 'Manufacturer or brand name. Defaults to "Adobe" for all products.',
    },
    gtin: {
        label: 'GTIN',
        type: 'text',
        required: false,
        pattern: /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/,
        editable: true,
        showInModal: false,
        tooltip: 'Global Trade Item Number (8, 12, 13, or 14 digits). Optional for digital products.',
        placeholder: '00012345678905',
        description: 'Product barcode number. Leave empty for digital software.',
    },
    mpn: {
        label: 'MPN',
        type: 'text',
        required: false,
        maxLength: 70,
        editable: true,
        showInModal: true,
        tooltip: 'Manufacturer Part Number assigned by Adobe (max 70 characters).',
        placeholder: 'CC-ALL-APPS-COM-1Y',
        description: 'Internal part number used for product identification.',
    },
    seller_name: {
        label: 'Seller Name',
        type: 'text',
        required: false,
        maxLength: 1000,
        editable: false,
        showInModal: false,
        tooltip: 'Name of the seller. Auto-populated as "Adobe".',
        placeholder: 'Adobe',
        description: 'Seller/merchant name. Always "Adobe" for our products.',
    },
    seller_url: {
        label: 'Seller URL',
        type: 'url',
        required: false,
        maxLength: 2000,
        editable: false,
        showInModal: false,
        tooltip: 'Seller website URL. Auto-populated as "https://www.adobe.com".',
        placeholder: 'https://www.adobe.com',
        description: "URL to seller's website. Points to adobe.com domain.",
    },
    return_policy: {
        label: 'Return Policy',
        type: 'url',
        required: false,
        maxLength: 2000,
        editable: false,
        showInModal: false,
        tooltip: 'Return policy URL. Auto-populated with Adobe terms link.',
        placeholder: 'https://www.adobe.com/legal/terms.html',
        description: 'Link to return/refund policy for digital products.',
    },
    return_window: {
        label: 'Return Window',
        type: 'integer',
        required: false,
        min: 0,
        editable: false,
        showInModal: false,
        tooltip: 'Return period in days. Auto-populated as 14 days per Adobe policy.',
        placeholder: '14',
        description: 'Number of days for returns. Standard 14-day policy.',
    },
    enable_search: {
        label: 'Enable Search',
        type: 'boolean',
        required: false,
        editable: false,
        showInModal: false,
        tooltip: 'Allow product to appear in ChatGPT searches. Always true.',
        placeholder: 'true',
        description: 'Whether product is searchable. Enabled by default.',
    },
    enable_checkout: {
        label: 'Enable Checkout',
        type: 'boolean',
        required: false,
        editable: false,
        showInModal: false,
        tooltip: 'Allow direct checkout in ChatGPT. Disabled (users redirected to adobe.com).',
        placeholder: 'false',
        description: 'Direct checkout capability. Disabled - redirects to Adobe site.',
    },
    condition: {
        label: 'Condition',
        type: 'select',
        required: false,
        options: ['new', 'refurbished', 'used'],
        editable: true,
        showInModal: false,
        tooltip: 'Product condition. Always "new" for digital software.',
        placeholder: 'new',
        description: 'Condition of the product. Digital products are always new.',
    },
    age_group: {
        label: 'Age Group',
        type: 'select',
        required: false,
        options: ['newborn', 'infant', 'toddler', 'kids', 'adult'],
        editable: true,
        showInModal: false,
        tooltip: 'Target age group for the product. Typically "adult" for professional software.',
        placeholder: 'adult',
        description: 'Intended age demographic for this product.',
    },
    color: {
        label: 'Color',
        type: 'text',
        required: false,
        maxLength: 100,
        editable: true,
        showInModal: false,
        tooltip: 'Product color if applicable (max 100 characters). Not used for digital products.',
        placeholder: 'N/A',
        description: 'Physical product color. Not applicable to software.',
    },
    gender: {
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['male', 'female', 'unisex'],
        editable: true,
        showInModal: false,
        tooltip: 'Target gender if relevant. Use "unisex" for products targeting all genders.',
        placeholder: 'unisex',
        description: 'Intended gender demographic. Software is typically unisex.',
    },
    material: {
        label: 'Material',
        type: 'text',
        required: false,
        maxLength: 200,
        editable: true,
        showInModal: false,
        tooltip: 'Primary material composition (max 200 characters). Set to "Digital Software" for apps.',
        placeholder: 'Digital Software',
        description: 'What the product is made of. Digital products use "Digital Software".',
    },
    pattern: {
        label: 'Pattern',
        type: 'text',
        required: false,
        maxLength: 100,
        editable: true,
        showInModal: false,
        tooltip: 'Pattern or design style (max 100 characters). Not used for digital products.',
        placeholder: 'N/A',
        description: 'Visual pattern or design. Not applicable to software.',
    },
    size: {
        label: 'Size',
        type: 'text',
        required: false,
        maxLength: 100,
        editable: true,
        showInModal: false,
        tooltip: 'Product size if applicable (max 100 characters). Not used for digital products.',
        placeholder: 'N/A',
        description: 'Physical size specification. Not applicable to software.',
    },
    weight: {
        label: 'Weight',
        type: 'text',
        required: false,
        pattern: /^\d+(\.\d+)?\s(oz|lb|g|kg)$/,
        editable: true,
        showInModal: false,
        tooltip: 'Product weight with unit (e.g., "0 lb"). Digital products have zero weight.',
        placeholder: '0 lb',
        description: 'Shipping weight with unit. Digital products are weightless (0 lb).',
    },
    additional_image_links: {
        label: 'Additional Images',
        type: 'textarea',
        required: false,
        editable: true,
        showInModal: true,
        tooltip: 'Additional product image URLs, one per line (max 10 images, HTTPS only).',
        placeholder: 'https://www.adobe.com/image2.jpg\nhttps://www.adobe.com/image3.jpg',
        description: 'Supplementary product images. Enter one URL per line.',
    },
    sale_price: {
        label: 'Sale Price',
        type: 'currency',
        required: false,
        pattern: /^\d+(\.\d{2})?\s[A-Z]{3}$/,
        editable: true,
        showInModal: false,
        tooltip: 'Promotional price if product is on sale (format: "39.99 USD").',
        placeholder: '39.99 USD',
        description: 'Discounted price during sale period. Must be less than regular price.',
    },
    sale_price_effective_start_date: {
        label: 'Sale Start Date',
        type: 'datetime',
        required: false,
        editable: true,
        showInModal: false,
        tooltip: 'When sale price becomes active (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ).',
        placeholder: '2025-01-01T00:00:00Z',
        description: 'Sale period start timestamp. Required if sale_price is set.',
    },
    sale_price_effective_end_date: {
        label: 'Sale End Date',
        type: 'datetime',
        required: false,
        editable: true,
        showInModal: false,
        tooltip: 'When sale price ends (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ).',
        placeholder: '2025-01-31T23:59:59Z',
        description: 'Sale period end timestamp. Required if sale_price is set.',
    },
    product_highlights: {
        label: 'Product Highlights',
        type: 'textarea',
        required: false,
        editable: true,
        showInModal: false,
        tooltip: 'Key product features, one per line (max 10 highlights, 150 chars each).',
        placeholder: 'Access to 20+ creative apps\nCloud storage and libraries\nRegular updates and new features',
        description: 'Bullet points highlighting main features. One feature per line.',
    },
    product_detail: {
        label: 'Product Details',
        type: 'object',
        required: false,
        editable: true,
        showInModal: false,
        tooltip: 'Structured product specifications (JSON format with section_name and attributes).',
        placeholder: '{"section_name": "Technical Specs", "attributes": [{"name": "Platform", "value": "Windows, macOS"}]}',
        description: 'Technical specifications in JSON format for detailed product info.',
    },
};

export function getFieldMetadata(fieldName) {
    return (
        PRODUCT_FEED_FIELDS[fieldName] || {
            label: fieldName,
            type: 'text',
            required: false,
            editable: true,
            tooltip: 'Product feed field',
            description: '',
        }
    );
}

export function getRequiredFields() {
    return Object.entries(PRODUCT_FEED_FIELDS)
        .filter(([, meta]) => meta.required)
        .map(([name]) => name);
}

export function getEditableFields() {
    return Object.entries(PRODUCT_FEED_FIELDS)
        .filter(([, meta]) => meta.editable)
        .map(([name]) => name);
}

export function validateField(fieldName, value) {
    const meta = getFieldMetadata(fieldName);
    const errors = [];

    if (meta.required && !value) {
        errors.push(`${meta.label} is required`);
        return errors;
    }

    if (!value) return errors;

    if (meta.maxLength && value.length > meta.maxLength) {
        errors.push(`${meta.label} must be ${meta.maxLength} characters or less (currently ${value.length})`);
    }

    if (meta.pattern && !meta.pattern.test(value)) {
        errors.push(`${meta.label} format is invalid`);
    }

    if (meta.type === 'integer') {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) {
            errors.push(`${meta.label} must be a number`);
        } else if (meta.min !== undefined && num < meta.min) {
            errors.push(`${meta.label} must be at least ${meta.min}`);
        }
    }

    if (meta.type === 'url' && value) {
        try {
            const url = new URL(value);
            if (!url.protocol.startsWith('https')) {
                errors.push(`${meta.label} must use HTTPS protocol`);
            }
        } catch {
            errors.push(`${meta.label} must be a valid URL`);
        }
    }

    return errors;
}

export function validateAllFields(productData) {
    const allErrors = {};

    Object.entries(productData).forEach(([fieldName, value]) => {
        const errors = validateField(fieldName, value);
        if (errors.length > 0) {
            allErrors[fieldName] = errors;
        }
    });

    return allErrors;
}
