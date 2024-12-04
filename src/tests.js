import { setTimeout } from 'timers/promises';
import fs from 'fs';
import * as csstree from 'css-tree';
import {
  launchBrowser,
  hasElementBySelectors,
  getStyle,
} from 'lib-verstka-tests';

const semanticTags = async (page, tags) => {
  const tagsAfterSearch = await Promise.all(tags.map(async (tagName) => {
    const isFound = await hasElementBySelectors(page, tagName);

    return {
      tagName,
      isMissing: !isFound,
    };
  }));
  const missingTags = tagsAfterSearch.filter(({ isMissing }) => isMissing);
  const missingTagNames = missingTags.map(({ tagName }) => tagName);

  if (missingTagNames.length) {
    return {
      id: 'semanticTagsMissing',
      values: {
        tagNames: missingTagNames.join(', '),
      },
    };
  }

  return false;
};

const fonts = (cssPath, fontList) => {
  const cssCode = fs.readFileSync(cssPath, 'utf-8');
  const ast = csstree.parse(cssCode);
  const fontNodes = csstree.findAll(ast, (node) => node.type === 'Atrule' && node.name === 'font-face');
  const fontCodeList = fontNodes.map((node) => csstree.generate(node.block));
  const missingFonts = fontList.filter((font) => !fontCodeList.some((code) => code.includes(font)));

  if (missingFonts.length) {
    return {
      id: 'fontsMissing',
      values: {
        fontNames: missingFonts.join(', '),
      },
    };
  }

  return false;
};

const variantFontFormats = (cssPath, font) => {
  const formats = ['woff2 supports variations', 'woff2-variations'];
  const cssCode = fs.readFileSync(cssPath, 'utf-8');
  const ast = csstree.parse(cssCode);
  const fontNodes = csstree.findAll(ast, (node) => node.type === 'Atrule' && node.name === 'font-face');
  const fontCodeList = fontNodes.map((node) => csstree.generate(node.block));
  const fontCode = fontCodeList.find((code) => code.includes(font)) ?? '';
  const missingFontFormats = formats.filter((format) => !fontCode.includes(format));

  if (missingFontFormats.length !== 0) {
    return {
      id: 'variantFontFormatMissing',
      values: {
        formats: missingFontFormats.join(', '),
      },
    };
  }

  return false;
};

const variantFontWeight = (cssPath, font) => {
  const weights = ['400', '785'];
  const cssCode = fs.readFileSync(cssPath, 'utf-8');
  const ast = csstree.parse(cssCode);
  const fontNodes = csstree.findAll(ast, (node) => node.type === 'Atrule' && node.name === 'font-face');
  const fontCodeList = fontNodes.map((node) => csstree.generate(node.block));
  const fontCode = fontCodeList.find((code) => code.includes(font)) ?? '';
  const fontWeight = fontCode.replace(/^{+|}+$/g, '').split(';').find((item) => item.includes('font-weight'));

  if (!fontWeight) {
    return {
      id: 'variantFontWeightMissing',
      values: {
        weights: weights.join(', '),
      },
    };
  }

  const weightValues = fontWeight
    .split(':')[1]
    .split(' ');
  const missingFontWeights = weights.filter((value) => !weightValues.includes(value));

  if (missingFontWeights.length) {
    return {
      id: 'variantFontWeightMissing',
      values: {
        weights: missingFontWeights.join(', '),
      },
    };
  }

  return false;
};

const varsDeclAndUsage = (styleCode) => {
  const ast = csstree.parse(styleCode);
  const variableDeclarations = csstree.findAll(ast, (node) => {
    if (typeof node?.property === 'string') {
      return node?.property.startsWith('--');
    }
    return false;
  });
  const variableDeclarationsList = variableDeclarations.map((decl) => csstree.generate(decl));

  if (variableDeclarationsList.length === 0) {
    return { id: 'varsNotDeclOrNotUsage' };
  }

  const variableUsages = csstree.findAll(ast, (node) => {
    if (typeof node?.name === 'string') {
      return node?.name.startsWith('--');
    }
    return false;
  });
  const variableUsagesList = variableUsages.map((decl) => csstree.generate(decl));

  if (variableUsagesList.length === 0) {
    return { id: 'varsNotDeclOrNotUsage' };
  }

  return false;
};

const fontVariationSettings = (styleCode) => {
  const ast = csstree.parse(styleCode);
  const settings = csstree.find(ast, (node) => node.property === 'font-variation-settings');

  if (!settings) {
    return { id: 'fontVariationSettingsMissing' };
  }

  const settingsCode = csstree.generate(settings);

  if (!settingsCode.includes('wght')) {
    return { id: 'fontVariationSettingsMissing' };
  }

  return false;
};

const transition = (styleCode) => {
  const ast = csstree.parse(styleCode);
  const transitionDeclarations = csstree.findAll(ast, (node) => node.type === 'Declaration' && (node.property === 'transition' || node.property === 'transition-property'));
  const transitionProperties = transitionDeclarations.map((decl) => csstree.generate(decl));
  const values = transitionProperties
    .map((prop) => prop.split(':')[1])
    .map((value) => value.split(','))
    .flat()
    .map((value) => value.split(' '))
    .flat();

  if (values.some((value) => value === 'all')) {
    return { id: 'transition' };
  }

  return false;
};

const background = async (page) => {
  const [backgroundStyle] = await getStyle(page, 'body', ['background']);

  if (backgroundStyle.includes('url')) {
    return { id: 'backgroundUrl' };
  }

  return false;
};

const filters = async (page) => {
  const filterList = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    if (images.length === 0) {
      return [];
    }

    const properties = [...images].map((image) => (
      window.getComputedStyle(image).getPropertyValue('filter')
    ));

    return properties;
  });

  if (filterList.length === 0) {
    return { id: 'filters.missing' };
  }

  const unique = filterList.filter((value, index, self) => self.indexOf(value) === index);

  if (unique.length < 7) {
    return { id: 'filters.unique' };
  }

  const hasMultiple = unique
    .map((item) => item.split(' '))
    .some((item) => item.length > 1);

  if (!hasMultiple) {
    return { id: 'filters.multiple' };
  }

  return false;
};

const supports = (styleCode) => {
  const ast = csstree.parse(styleCode);
  let supportsTextStroke = false;

  function supportsTextStrokeCheck(prelude) {
    let result = false;
    csstree.walk(prelude, (node) => {
      if (node.type === 'Declaration') {
        const property = node.property.toLowerCase();
        if (property === 'text-stroke' || property === '-webkit-text-stroke') {
          result = true;
        }
      }
    });
    return result;
  }

  csstree.walk(ast, {
    visit: 'Atrule',
    enter: (node) => {
      if (
        node.name === 'supports'
        && supportsTextStrokeCheck(node.prelude)
      ) {
        supportsTextStroke = true;
      }
    },
  });

  if (!supportsTextStroke) {
    return { id: 'supports' };
  }

  return false;
};

const modal = async (url) => {
  const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  const viewport = { width: 1440, height: 1080 };
  const { browser, page } = await launchBrowser(url, { launchOptions, viewport });
  await setTimeout(5000);

  try {
    const elements = await page.$x("/html/body//*[contains(translate(., 'СОХРАНИТЬ', 'сохранить'), 'сохранить')]");

    if (elements.length === 0) {
      await browser.close();
      return { id: 'modal.saveButtonMissing' };
    }

    let dialog = await page.evaluate((button) => {
      button.click();
      return document.querySelector('dialog');
    }, elements[elements.length - 1]);

    if (!dialog) {
      await browser.close();
      return { id: 'modal.dialogMissing' };
    }

    let [display] = await getStyle(page, 'dialog', ['display']);

    if (display === 'none') {
      await browser.close();
      return { id: 'modal.notShown' };
    }

    const buttonEng = await page.$x("/html/body//*[contains(translate(., 'OK', 'ok'), 'ok')]");
    const buttonRus = await page.$x("/html/body//*[contains(translate(., 'ОК', 'ок'), 'ок')]");
    let buttonOk;

    if (buttonEng.length > 0) {
      buttonOk = buttonEng[buttonEng.length - 1];
    } else if (buttonRus.length > 0) {
      buttonOk = buttonRus[buttonRus.length - 1];
    } else {
      await browser.close();
      return { id: 'modal.okButtonMissing' };
    }

    dialog = await page.evaluate((button) => {
      button.click();
      return document.querySelector('dialog');
    }, buttonOk);
    await setTimeout(1000);
    [display] = await getStyle(page, 'dialog', ['display']);

    if (display !== 'none' && dialog) {
      await browser.close();
      return { id: 'modal.notHidden' };
    }
  } catch (error) {
    await browser.close();

    return {
      id: 'testsError',
      values: {
        message: 'Убедитесь, что страница не перезагружается при взаимодействии с кнопками: Сохранить на память, ОК.',
      },
    };
  }

  await browser.close();

  return false;
};

export {
  semanticTags,
  fonts,
  variantFontFormats,
  variantFontWeight,
  varsDeclAndUsage,
  fontVariationSettings,
  transition,
  background,
  filters,
  supports,
  modal,
};
