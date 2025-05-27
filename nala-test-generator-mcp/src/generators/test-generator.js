/**
 * @typedef {import('../types.js').CardConfig} CardConfig
 * @typedef {import('../types.js').TestType} TestType
 */

export class TestGenerator {
  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateTestFile(config, testType) {
    const imports = this.generateImports(config, testType);
    const setup = this.generateSetup(config);
    const tests = this.generateTests(config, testType);

    return `${imports}

${setup}

test.describe('M@S Studio CCD ${this.capitalize(config.cardType)} card test suite', () => {
${tests}
});
`;
  }

  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateImports(config, testType) {
    const className = this.generateClassName(config.cardType);
    const specFileName = `${config.cardType}_${testType}.spec.js`;
    
    let imports = `import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import ${className}Spec from '../specs/${specFileName}';
import ${className} from '../${config.cardType}.page.js';
import WebUtil from '../../../../libs/webutil.js';`;

    if (testType === 'edit' || testType === 'save' || testType === 'discard') {
      imports += `\nimport EditorPage from '../../../editor.page.js';`;
    }

    if (testType === 'edit' || testType === 'save') {
      imports += `\nimport OSTPage from '../../../ost.page.js';`;
    }

    return imports;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateSetup(config) {
    const className = this.generateClassName(config.cardType);
    const variableName = config.cardType.replace(/-/g, '');
    const testType = config.testTypes?.[0] || 'css';

    let setup = `const { features } = ${className}Spec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let ${variableName};
let webUtil;`;

    // Only add editor and ost variables for test types that need them
    if (testType === 'edit' || testType === 'save' || testType === 'discard') {
      setup += `\nlet editor;`;
    }
    
    if (testType === 'edit' || testType === 'save') {
      setup += `\nlet ost;`;
    }
    
    if (config.testTypes?.includes('save')) {
      setup += `\nlet clonedCardID;`;
    }

    setup += `

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    ${variableName} = new ${className}(page);
    webUtil = new WebUtil(page);`;

    // Only instantiate editor and ost for test types that need them
    if (testType === 'edit' || testType === 'save' || testType === 'discard') {
      setup += `\n    editor = new EditorPage(page);`;
    }
    
    if (testType === 'edit' || testType === 'save') {
      setup += `\n    ost = new OSTPage(page);`;
    }

    setup += `\n});`;

    return setup;
  }

  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateTests(config, testType) {
    switch (testType) {
      case 'css':
        return this.generateCSSTests(config);
      case 'functional':
        return this.generateFunctionalTests(config);
      case 'edit':
        return this.generateEditTests(config);
      case 'save':
        return this.generateSaveTests(config);
      case 'discard':
        return this.generateDiscardTests(config);
      case 'interaction':
        return this.generateInteractionTests(config);
      default:
        return '';
    }
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateCSSTests(config) {
    const variableName = config.cardType.replace(/-/g, '');
    let tests = '';
    let featureIndex = 0;

    tests += this.generateSingleCSSTest(config, featureIndex, 'card', 'card', variableName);
    featureIndex++;

    Object.keys(config.elements).forEach(elementName => {
      tests += this.generateSingleCSSTest(config, featureIndex, elementName, elementName, variableName);
      featureIndex++;
    });

    return tests;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @param {string} elementName
   * @param {string} cssPropertyName
   * @param {string} variableName
   * @returns {string}
   */
  generateSingleCSSTest(config, featureIndex, elementName, cssPropertyName, variableName) {
    const testDescription = elementName === 'card' ? 
      `Validate CSS for ${config.cardType} card size, background and border color` :
      `Validate ${elementName} CSS for ${config.cardType} cards`;

    const locatorCode = elementName === 'card' ? 
      `${variableName}Card` : 
      `${variableName}Card.locator(${variableName}.${this.camelCase(elementName)})`;

    return `
    // @studio-${config.cardType}-css-${elementName} - ${testDescription}
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        const ${variableName}Card = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate ${config.cardType} card CSS', async () => {
            await expect(${variableName}Card).toBeVisible();
            expect(
                await webUtil.verifyCSS(${locatorCode}, ${variableName}.cssProp.${cssPropertyName}),
            ).toBeTruthy();
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateEditTests(config) {
    let tests = '';
    let featureIndex = 0;

    if (config.elements.title) {
      tests += this.generateEditTitleTest(config, featureIndex);
          featureIndex++;
    }

    if (config.elements.eyebrow) {
      tests += this.generateEditEyebrowTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.description) {
      tests += this.generateEditDescriptionTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.icon) {
      tests += this.generateEditIconTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.backgroundImage) {
      tests += this.generateEditBackgroundTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.price) {
      tests += this.generateEditPriceTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.cta) {
      tests += this.generateEditCTATest(config, featureIndex);
      featureIndex++;
    }

    return tests;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditTitleTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-title - Validate edit title for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Validate edited title field in Editor panel', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
        });

        await test.step('step-5: Validate edited title field on the card', async () => {
            await expect(await ${variableName}.cardTitle).toHaveText(data.newTitle);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditEyebrowTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-eyebrow - Validate edit eyebrow field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
            await editor.subtitle.fill(data.newSubtitle);
        });

        await test.step('step-4: Validate edited eyebrow/subtitle field in Editor panel', async () => {
            await expect(await editor.subtitle).toHaveValue(data.newSubtitle);
        });

        await test.step('step-5: Validate edited eyebrow field on the card', async () => {
            await expect(await ${variableName}.cardEyebrow).toHaveText(
                data.newSubtitle,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditDescriptionTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-description - Validate edit description field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Validate edited description in Editor panel', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
        });

        await test.step('step-5: Validate edited description on the card', async () => {
            await expect(await ${variableName}.cardDescription).toHaveText(
                data.newDescription,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditIconTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-mnemonic - Validate edit mnemonic URL field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate edited mnemonic URL field in Editor panel', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
        });

        await test.step('step-5: Validate edited mnemonic URL on the card', async () => {
            await expect(await ${variableName}.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditBackgroundTest(config, featureIndex) {
    return `
    // @studio-${config.cardType}-edit-background - Validate edit background field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue('');
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-4: Validate edited background image URL field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(
                data.newBackgroundURL,
            );
        });

        await test.step('step-5: Validate edited background image URL field on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditPriceTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-price - Validate edit price field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(await editor.prices).not.toContainText(
                data.newStrikethroughPrice,
            );

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.newStrikethroughPrice,
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await ${variableName}.cardPrice).toContainText(
                data.newPrice,
            );
            await expect(await ${variableName}.cardPrice).toContainText(
                data.newStrikethroughPrice,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateEditCTATest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-edit-cta-label - Validate edit CTA label for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-${config.cardType}',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(
                await editor.footer.locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText);
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await ${variableName}.cardCTA).toContainText(
                data.newCtaText,
            );
            await expect(await ${variableName}.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await ${variableName}.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateSaveTests(config) {
    let tests = '';
    let featureIndex = 0;

    if (config.elements.title) {
      tests += this.generateSaveTitleTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.eyebrow) {
      tests += this.generateSaveEyebrowTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.description) {
      tests += this.generateSaveDescriptionTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.icon) {
      tests += this.generateSaveIconTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.backgroundImage) {
      tests += this.generateSaveBackgroundTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.price) {
      tests += this.generateSavePriceTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.cta) {
      tests += this.generateSaveCTATest(config, featureIndex);
      featureIndex++;
    }

    return tests;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveTitleTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-title - Validate saving card after editing card title
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit title and save card', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card title', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(
                await clonedCard.locator(${variableName}.cardTitle),
            ).toHaveText(data.newTitle);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveEyebrowTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-eyebrow - Validate saving card after editing card eyebrow
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit eyebrow and save card', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
            await editor.subtitle.fill(data.newSubtitle);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card eyebrow', async () => {
            await expect(await editor.subtitle).toHaveValue(data.newSubtitle);
            await expect(
                await clonedCard.locator(${variableName}.cardEyebrow),
            ).toHaveText(data.newSubtitle);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveDescriptionTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-description - Validate saving card after editing card description
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit description and save card', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card description', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
            await expect(
                await clonedCard.locator(${variableName}.cardDescription),
            ).toHaveText(data.newDescription);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveIconTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-mnemonic - Validate saving card after editing card mnemonic
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit mnemonic and save card', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card mnemonic', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(
                await clonedCard.locator(${variableName}.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveBackgroundTest(config, featureIndex) {
    return `
    // @studio-${config.cardType}-save-edited-image - Validate saving card after editing card background image
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit fields and save card', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue('');
            await editor.backgroundImage.fill(data.newBackgroundURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card image', async () => {
            await expect(await editor.backgroundImage).toHaveValue(
                data.newBackgroundURL,
            );
            await expect(await clonedCard).toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSavePriceTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-price - Validate saving card after editing card price
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card price', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(
                await clonedCard.locator(${variableName}.cardPrice),
            ).toContainText(data.price);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateSaveCTATest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-save-edited-cta-label - Validate saving card after editing CTA label
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit CTA and save card', async () => {
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card CTA', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
            await expect(
                await clonedCard.locator(${variableName}.cardCTA),
            ).toContainText(data.newCtaText);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateDiscardTests(config) {
    let tests = '';
    let featureIndex = 0;

    if (config.elements.title) {
      tests += this.generateDiscardTitleTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.eyebrow) {
      tests += this.generateDiscardEyebrowTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.description) {
      tests += this.generateDiscardDescriptionTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.icon) {
      tests += this.generateDiscardIconTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.backgroundImage) {
      tests += this.generateDiscardBackgroundTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.price) {
      tests += this.generateDiscardPriceTest(config, featureIndex);
      featureIndex++;
    }

    if (config.elements.cta) {
      tests += this.generateDiscardCTATest(config, featureIndex);
      featureIndex++;
    }

      return tests;
    }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardTitleTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-title - Validate discard edited title for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardTitle).toHaveText(data.title);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardEyebrowTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-eyebrow - Validate discard edited eyebrow field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await editor.subtitle.fill(data.newSubtitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardEyebrow).toHaveText(data.subtitle);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardDescriptionTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-description - Validate discard edited description field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardDescription).toContainText(
                data.description,
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardIconTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-mnemonic - Validate discard edited mnemonic field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardIcon).toHaveAttribute(
                'src',
                data.iconURL,
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardBackgroundTest(config, featureIndex) {
    return `
    // @studio-${config.cardType}-discard-edited-background - Validate discard edited background field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardPriceTest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-price - Validate discard edited price field for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardPrice).toContainText(data.price);
            await expect(await ${variableName}.cardPrice).toContainText(
                data.strikethroughPrice,
            );
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @returns {string}
   */
  generateDiscardCTATest(config, featureIndex) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-discard-edited-cta-label - Validate discard edited CTA label for ${config.cardType} card in mas studio
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await ${variableName}.cardCTA).toContainText(data.ctaText);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateFunctionalTests(config) {
    let tests = '';
    let featureIndex = 0;

    Object.entries(config.elements).forEach(([elementName, elementConfig]) => {
      if (elementConfig?.interactions) {
        elementConfig.interactions.forEach(interaction => {
          tests += this.generateFunctionalTest(config, featureIndex, elementName, interaction.type);
        featureIndex++;
        });
      }
    });

    return tests;
  }

  /**
   * @param {CardConfig} config
   * @param {number} featureIndex
   * @param {string} elementName
   * @param {string} interactionType
   * @returns {string}
   */
  generateFunctionalTest(config, featureIndex, elementName, interactionType) {
    const variableName = config.cardType.replace(/-/g, '');

    return `
    // @studio-${config.cardType}-${interactionType}-${elementName} - Test ${interactionType} interaction on ${elementName}
    test(\`\${features[${featureIndex}].name},\${features[${featureIndex}].tags}\`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[${featureIndex}];
        const testPage = \`\${baseURL}\${features[${featureIndex}].path}\${miloLibs}\${features[${featureIndex}].browserParams}\${data.cardid}\`;
        const ${variableName}Card = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Perform ${interactionType} on ${elementName}', async () => {
            await expect(${variableName}Card).toBeVisible();
            await ${variableName}Card.locator(${variableName}.${this.camelCase(elementName)}).${this.getPlaywrightAction(interactionType)}();
        });
    });
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateInteractionTests(config) {
    return this.generateFunctionalTests(config);
  }

  /**
   * @param {string} interactionType
   * @returns {string}
   */
  getPlaywrightAction(interactionType) {
    switch (interactionType) {
      case 'click':
        return 'click';
      case 'hover':
        return 'hover';
      case 'type':
        return 'fill';
      default:
        return 'click';
    }
  }

  /**
   * @param {string} cardType
   * @returns {string}
   */
  generateClassName(cardType) {
    const words = cardType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    return `CCD${words.join('')}`;
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 