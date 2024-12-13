/**
  * Take a screenshot of a page
  * @param {Page} page - The page object
  * @param {string} folderPath - The folder path to save the screenshot, e.g., screenshots/milo
  * @param {string} fileName - The file name of the screenshot
  * @param {object} options - The screenshot options, see https://playwright.dev/docs/api/class-page#page-screenshot
  * @returns {object} The screenshot result
*/
async function take(page, folderPath, fileName, options = {}) {
  const urls = [];
  const result = {};
  const name = `${folderPath}/${fileName}.png`;
  urls.push(page.url());
  options.path = name;
  if (options.selector) {
    await page.locator(options.selector).screenshot(options);
  } else {
    await page.screenshot(options);
  }
  result.a = name;
  result.urls = urls.join(' | ');
  return result;
}

export default { take };
