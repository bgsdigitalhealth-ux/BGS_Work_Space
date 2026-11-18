const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store Puppeteer Chrome cache inside Backend/.cache/puppeteer so Render preserves it at runtime
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
