/**
 * @typedef {import('../types.js').CardConfig} CardConfig
 * @typedef {import('../types.js').TestSuiteConfig} TestSuiteConfig
 * @typedef {import('../types.js').TestSpec} TestSpec
 * @typedef {import('../types.js').TestType} TestType
 */

export class SpecGenerator {
  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateTestSpec(config, testType = 'css') {
    return this.generateSpecFile(config, testType);
  }

  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateSpecFile(config, testType) {
    const featureName = this.generateFeatureName(config);
    const features = this.generateFeatures(config, testType);

    return `export default {
    FeatureName: '${featureName}',
    features: [${features}
    ],
};
`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateFeatureName(config) {
    const cardTypeName = config.cardType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    return `M@S Studio CCD ${cardTypeName}`;
  }

  /**
   * @param {CardConfig} config
   * @param {TestType} testType
   * @returns {string}
   */
  generateFeatures(config, testType) {
    switch (testType) {
      case 'css':
        return this.generateCSSFeatures(config);
      case 'edit':
        return this.generateEditFeatures(config);
      case 'save':
        return this.generateSaveFeatures(config);
      case 'discard':
        return this.generateDiscardFeatures(config);
      case 'functional':
      case 'interaction':
        return this.generateFunctionalFeatures(config);
      default:
        return '';
    }
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateCSSFeatures(config) {
    let features = '';
    let tcid = 0;

    features += this.generateCSSFeature(config, tcid, 'card', 'card');
    tcid++;

    Object.keys(config.elements).forEach(elementName => {
      features += this.generateCSSFeature(config, tcid, elementName, elementName);
      tcid++;
    });

    return features;
  }

  /**
   * @param {CardConfig} config
   * @param {number} tcid
   * @param {string} elementName
   * @param {string} testName
   * @returns {string}
   */
  generateCSSFeature(config, tcid, elementName, testName) {
    const tags = this.generateTags(config, 'css', elementName);
    const cardId = config.cardId || '206a8742-0289-4196-92d4-ced99ec4191e';
    
    // Use path and browserParams from metadata directly
    const path = config.metadata?.path || '/studio.html';
    const browserParams = config.metadata?.browserParams || '#query=';

    return `
        {
            tcid: '${tcid}',
            name: '@studio-${config.cardType}-css-${testName}',
            path: '${path}',
            data: {
                cardid: '${cardId}',
            },
            browserParams: '${browserParams}',
            tags: '${tags}',
        },`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateEditFeatures(config) {
    let features = '';
    let tcid = 0;

    if (config.elements.title) {
      features += this.generateEditFeature(config, tcid, 'title', {
        title: 'Automation Test Card',
        newTitle: 'Change title'
      });
      tcid++;
    }

    if (config.elements.eyebrow) {
      features += this.generateEditFeature(config, tcid, 'eyebrow', {
        subtitle: 'do not edit',
        newSubtitle: 'Change subtitle'
      });
      tcid++;
    }

    if (config.elements.description) {
      features += this.generateEditFeature(config, tcid, 'description', {
        description: 'MAS repo validation card for Nala tests',
        newDescription: 'New Test Description'
      });
      tcid++;
    }

    if (config.elements.icon) {
      features += this.generateEditFeature(config, tcid, 'mnemonic', {
        iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
        newIconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg'
      });
      tcid++;
    }

    if (config.elements.backgroundImage) {
      features += this.generateEditFeature(config, tcid, 'background', {
        newBackgroundURL: 'https://main--milo--adobecom.aem.page/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png'
      });
      tcid++;
    }

    if (config.elements.price) {
      features += this.generateEditFeature(config, tcid, 'price', {
        price: 'US$17.24/mo',
        strikethroughPrice: 'US$34.49/mo',
        newPrice: 'US$17.24/moper license',
        newStrikethroughPrice: 'US$34.49/moper license'
      });
      tcid++;
    }

    if (config.elements.cta) {
      features += this.generateEditFeature(config, tcid, 'cta-label', {
        osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
        ctaText: 'Buy now',
        newCtaText: 'Buy now 2'
      });
      tcid++;
    }

    return features;
  }

  /**
   * @param {CardConfig} config
   * @param {number} tcid
   * @param {string} elementName
   * @param {Object} testData
   * @returns {string}
   */
  generateEditFeature(config, tcid, elementName, testData) {
    const tags = this.generateTags(config, 'edit', elementName);
    const cardId = config.cardId || '206a8742-0289-4196-92d4-ced99ec4191e';
    const dataEntries = Object.entries(testData).map(([key, value]) => 
      `                ${key}: '${value}',`
    ).join('\n');
    
    // Use path and browserParams from metadata directly
    const path = config.metadata?.path || '/studio.html';
    const browserParams = config.metadata?.browserParams || '#query=';

    return `
        {
            tcid: '${tcid}',
            name: '@studio-${config.cardType}-edit-${elementName}',
            path: '${path}',
            data: {
                cardid: '${cardId}',
${dataEntries}
            },
            browserParams: '${browserParams}',
            tags: '${tags}',
        },`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateSaveFeatures(config) {
    let features = '';
    let tcid = 0;

    if (config.elements.title) {
      features += this.generateSaveFeature(config, tcid, 'edited-title', {
        title: 'Field Edit & Save',
        newTitle: 'Cloned Field Edit'
      });
      tcid++;
    }

    if (config.elements.eyebrow) {
      features += this.generateSaveFeature(config, tcid, 'edited-eyebrow', {
        subtitle: 'do not edit',
        newSubtitle: 'New Subtitle'
      });
      tcid++;
    }

    if (config.elements.description) {
      features += this.generateSaveFeature(config, tcid, 'edited-description', {
        description: 'MAS repo validation card for Nala tests',
        newDescription: 'New Test Description'
      });
      tcid++;
    }

    if (config.elements.icon) {
      features += this.generateSaveFeature(config, tcid, 'edited-mnemonic', {
        iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
        newIconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg'
      });
      tcid++;
    }

    if (config.elements.backgroundImage) {
      features += this.generateSaveFeature(config, tcid, 'edited-image', {
        newBackgroundURL: 'https://main--milo--adobecom.aem.page/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png'
      });
      tcid++;
    }

    if (config.elements.price) {
      features += this.generateSaveFeature(config, tcid, 'edited-price', {
        price: 'US$17.24/mo',
        strikethroughPrice: 'US$34.49/mo'
      });
      tcid++;
    }

    if (config.elements.cta) {
      features += this.generateSaveFeature(config, tcid, 'edited-cta-label', {
        ctaText: 'Buy now',
        newCtaText: 'Buy now 2'
      });
      tcid++;
    }

    return features;
  }

  /**
   * @param {CardConfig} config
   * @param {number} tcid
   * @param {string} elementName
   * @param {Object} testData
   * @returns {string}
   */
  generateSaveFeature(config, tcid, elementName, testData) {
    const tags = this.generateTags(config, 'save', elementName);
    const cardId = config.cardId || 'cc85b026-240a-4280-ab41-7618e65daac4';
    const dataEntries = Object.entries(testData).map(([key, value]) => 
      `                ${key}: '${value}',`
    ).join('\n');
    
    // Use path and browserParams from metadata directly
    const path = config.metadata?.path || '/studio.html';
    const browserParams = config.metadata?.browserParams || '#query=';

    return `
        {
            tcid: '${tcid}',
            name: '@studio-${config.cardType}-save-${elementName}',
            path: '${path}',
            data: {
                cardid: '${cardId}',
${dataEntries}
            },
            browserParams: '${browserParams}',
            tags: '${tags}',
        },`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateDiscardFeatures(config) {
    let features = '';
    let tcid = 0;

    if (config.elements.title) {
      features += this.generateDiscardFeature(config, tcid, 'edited-title', {
        title: 'Automation Test Card',
        newTitle: 'Change title'
      });
      tcid++;
    }

    if (config.elements.eyebrow) {
      features += this.generateDiscardFeature(config, tcid, 'edited-eyebrow', {
        subtitle: 'do not edit',
        newSubtitle: 'Change subtitle'
      });
      tcid++;
    }

    if (config.elements.description) {
      features += this.generateDiscardFeature(config, tcid, 'edited-description', {
        description: 'MAS repo validation card for Nala tests',
        newDescription: 'New Test Description'
      });
      tcid++;
    }

    if (config.elements.icon) {
      features += this.generateDiscardFeature(config, tcid, 'edited-mnemonic', {
        iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
        newIconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg'
      });
      tcid++;
    }

    if (config.elements.backgroundImage) {
      features += this.generateDiscardFeature(config, tcid, 'edited-background', {
        newBackgroundURL: 'https://main--milo--adobecom.aem.page/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png'
      });
      tcid++;
    }

    if (config.elements.price) {
      features += this.generateDiscardFeature(config, tcid, 'edited-price', {
        price: 'US$17.24/mo',
        strikethroughPrice: 'US$34.49/mo',
        newPrice: 'US$17.24/moper license',
        newStrikethroughPrice: 'US$34.49/moper license'
      });
      tcid++;
    }

    if (config.elements.cta) {
      features += this.generateDiscardFeature(config, tcid, 'edited-cta-label', {
        ctaText: 'Buy now',
        newCtaText: 'Buy now 2'
      });
      tcid++;
    }

    return features;
  }

  /**
   * @param {CardConfig} config
   * @param {number} tcid
   * @param {string} elementName
   * @param {Object} testData
   * @returns {string}
   */
  generateDiscardFeature(config, tcid, elementName, testData) {
    const tags = this.generateTags(config, 'discard', elementName);
    const cardId = config.cardId || '206a8742-0289-4196-92d4-ced99ec4191e';
    const dataEntries = Object.entries(testData).map(([key, value]) => 
      `                ${key}: '${value}',`
    ).join('\n');
    
    // Use path and browserParams from metadata directly
    const path = config.metadata?.path || '/studio.html';
    const browserParams = config.metadata?.browserParams || '#query=';

    return `
        {
            tcid: '${tcid}',
            name: '@studio-${config.cardType}-discard-${elementName}',
            path: '${path}',
            data: {
                cardid: '${cardId}',
${dataEntries}
            },
            browserParams: '${browserParams}',
            tags: '${tags}',
        },`;
  }

  /**
   * @param {CardConfig} config
   * @returns {string}
   */
  generateFunctionalFeatures(config) {
    let features = '';
    let tcid = 0;

    Object.entries(config.elements).forEach(([elementName, elementConfig]) => {
      if (elementConfig?.interactions) {
        elementConfig.interactions.forEach(interaction => {
          features += this.generateFunctionalFeature(config, tcid, elementName, interaction.type);
          tcid++;
        });
      }
    });

    return features;
  }

  /**
   * @param {CardConfig} config
   * @param {number} tcid
   * @param {string} elementName
   * @param {string} interactionType
   * @returns {string}
   */
  generateFunctionalFeature(config, tcid, elementName, interactionType) {
    const tags = this.generateTags(config, 'functional', elementName);
    const cardId = config.cardId || '206a8742-0289-4196-92d4-ced99ec4191e';
    
    // Use path and browserParams from metadata directly
    const path = config.metadata?.path || '/studio.html';
    const browserParams = config.metadata?.browserParams || '#query=';

    return `
        {
            tcid: '${tcid}',
            name: '@studio-${config.cardType}-${interactionType}-${elementName}',
            path: '${path}',
            data: {
                cardid: '${cardId}',
            },
            browserParams: '${browserParams}',
            tags: '${tags}',
        },`;
  }

  /**
   * @param {CardConfig} config
   * @param {string} testType
   * @param {string} elementName
   * @returns {string}
   */
  generateTags(config, testType, elementName) {
    const baseTag = `@mas-studio @ccd @ccd-${config.cardType}`;
    const testTypeTag = `@ccd-${config.cardType}-${testType}`;
    
    if (testType === 'css') {
      return `${baseTag} ${testTypeTag} @ccd-css`;
    }
    
    return `${baseTag} ${testTypeTag}`;
  }
} 