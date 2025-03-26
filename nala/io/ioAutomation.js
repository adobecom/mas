import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
    const url = process.env.TEST_URL;
    console.log('Testing URL:', url);
    
    await page.goto(url);
    let merchCardSlice = page.locator('//merch-card[@id="51c23f28-504f-450d-9764-0e60f1e279b2"]');
    await expect(merchCardSlice).toBeVisible();
    let merchIcon = merchCardSlice.locator('//merch-icon');
    await expect(merchIcon).toBeVisible();
    const iconSrc = await merchIcon.getAttribute('src');
    expect(iconSrc).toBeTruthy();
    expect(iconSrc.length).toBeGreaterThan(0);
    
    let imageDiv = merchCardSlice.locator('div[slot="image"]');
    await expect(imageDiv).toBeVisible();
    let image = imageDiv.locator('img');
    await expect(image).toBeVisible();
    const imageSrc = await image.getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc.length).toBeGreaterThan(0);

    let priceSpan = merchCardSlice.locator('span[class="price"]');
    await expect(priceSpan).toBeVisible();

    let currencySymbol = priceSpan.locator('span[class="price-currency-symbol"]');
    await expect(currencySymbol).toBeVisible();

    let priceInteger = priceSpan.locator('span[class="price-integer"]'); 
    await expect(priceInteger).toBeVisible();

    let decimalsDelimiter = priceSpan.locator('span[class="price-decimals-delimiter"]');
    await expect(decimalsDelimiter).toBeVisible();

    let priceDecimals = priceSpan.locator('span[class="price-decimals"]');
    await expect(priceDecimals).toBeVisible();

    let priceRecurrence = priceSpan.locator('span[class="price-recurrence"]');
    await expect(priceRecurrence).toBeVisible();
    

    if (url.includes('locale=fr_FR')) {
        const recurrenceText = await priceRecurrence.textContent();
        expect(recurrenceText).toContain('mois');
    }

    let termsLink = merchCardSlice.locator('a[data-analytics-id="see-terms"]');
    await expect(termsLink).toBeVisible();
    const href = await termsLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href.length).toBeGreaterThan(0);

    let checkoutButton = merchCardSlice.locator('button[is="checkout-button"]');
    await expect(checkoutButton).toBeVisible();
    const dataHref = await checkoutButton.getAttribute('data-href');
    expect(dataHref).toBeTruthy();
    expect(dataHref).toContain('commerce.adobe.com');

    // Suggested Card

    let merchCardSuggested = page.locator('//merch-card[@id="549f6981-f5c8-4512-b41c-313d60f375b2"]');
    await expect(merchCardSuggested).toBeVisible();
    let merchIconSuggested = merchCardSuggested.locator('//merch-icon');
    await expect(merchIconSuggested).toBeVisible();
    const iconSrcSuggested = await merchIconSuggested.getAttribute('src');
    expect(iconSrcSuggested).toBeTruthy();
    expect(iconSrcSuggested.length).toBeGreaterThan(0);

    let headingXs = merchCardSuggested.locator('h3[slot="heading-xs"]');
    await expect(headingXs).toBeVisible();

    let detailS = merchCardSuggested.locator('h4[slot="detail-s"]'); 
    await expect(detailS).toBeVisible();

    let bodyXS = merchCardSuggested.locator('div[slot="body-xs"]');
    await expect(bodyXS).toBeVisible();

    let bodyText = bodyXS.locator('p');
    await expect(bodyText).toBeVisible();
    const text = await bodyText.textContent();
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(0);

    let bodyLink = bodyXS.locator('a');
    await expect(bodyLink).toBeVisible();
    const linkHref = await bodyLink.getAttribute('href');
    expect(linkHref).toBeTruthy();
    expect(linkHref.length).toBeGreaterThan(0);

    let priceSlotSuggested = merchCardSuggested.locator('p[slot="price"]');
    await expect(priceSlotSuggested).toBeVisible();

    // Check strikethrough price span
    let strikethroughPrice = priceSlotSuggested.locator('span[data-template="strikethrough"]');
    await expect(strikethroughPrice).toBeVisible();

    let priceCurrencySymbolStrike = strikethroughPrice.locator('span[class="price-currency-symbol"]');
    await expect(priceCurrencySymbolStrike).toBeVisible();

    let priceIntegerStrike = strikethroughPrice.locator('span[class="price-integer"]');
    await expect(priceIntegerStrike).toBeVisible();

    let priceDecimalsDelimiterStrike = strikethroughPrice.locator('span[class="price-decimals-delimiter"]');
    await expect(priceDecimalsDelimiterStrike).toBeVisible();

    let priceDecimalsStrike = strikethroughPrice.locator('span[class="price-decimals"]');
    await expect(priceDecimalsStrike).toBeVisible();

    let priceRecurrenceStrike = strikethroughPrice.locator('span[class="price-recurrence"]');
    await expect(priceRecurrenceStrike).toBeVisible();

    // Check regular price span
    let regularPrice = priceSlotSuggested.locator('span[data-template="price"]');
    await expect(regularPrice).toBeVisible();

    let priceCurrencySymbolRegular = regularPrice.locator('span[class="price-currency-symbol"]');
    await expect(priceCurrencySymbolRegular).toBeVisible();

    let priceIntegerRegular = regularPrice.locator('span[class="price-integer"]');
    await expect(priceIntegerRegular).toBeVisible();

    let priceDecimalsDelimiterRegular = regularPrice.locator('span[class="price-decimals-delimiter"]');
    await expect(priceDecimalsDelimiterRegular).toBeVisible();

    let priceDecimalsRegular = regularPrice.locator('span[class="price-decimals"]');
    await expect(priceDecimalsRegular).toBeVisible();

    let priceRecurrenceRegular = regularPrice.locator('span.price-recurrence');
    await expect(priceRecurrenceRegular).toBeVisible();

    // Check checkout button href
    let checkoutButtonSuggested = merchCardSuggested.locator('button[is="checkout-button"]');
    await expect(checkoutButtonSuggested).toBeVisible();
    const checkoutHrefSuggested = await checkoutButtonSuggested.getAttribute('data-href');
    expect(checkoutHrefSuggested).toBeTruthy();
    expect(checkoutHrefSuggested).toContain('commerce.adobe.com');
});


