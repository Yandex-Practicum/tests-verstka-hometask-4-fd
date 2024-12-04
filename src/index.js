import { setTimeout } from 'timers/promises';
import path from 'path';
import {
  launchBrowser,
  runTests,
  mkdir,
  mkfile,
  structure,
  stylelint,
  w3c,
  orderStyles,
  lang,
  titleEmmet,
  horizontalScroll,
} from 'lib-verstka-tests';
import ru from './locales/ru.js';
import {
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
} from './tests.js';
import {
  getStyleCode,
} from './utils.js';

const [, , PROJECT_PATH, LANG = 'ru'] = process.argv;

const app = async (projectPath, lng) => {
  const options = {
    projectPath,
    lang: lng,
    resource: ru,
  };

  const check = async () => {
    const tree = mkdir('project', [
      mkfile('index.html'),
      mkdir('scripts', [
        mkfile('like.js'),
        mkfile('set-theme.js'),
      ]),
      mkdir('styles', [
        mkfile('globals.css'),
        mkfile('style.css'),
        mkfile('variables.css'),
        mkfile('animations.css'),
        mkfile('themes.css'),
      ]),
      mkdir('fonts', [
        mkfile('fonts.css'),
      ]),
      mkdir('images', []),
      mkdir('svg', []),
    ]);
    const structureErrors = structure(projectPath, tree);

    if (structureErrors.length) {
      return structureErrors;
    }

    const baseUrl = 'http://localhost:3000';
    const viewport = { width: 1440, height: 1080 };
    const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    let browser;
    let page;

    try {
      ({ browser, page } = await launchBrowser(baseUrl, { launchOptions, viewport }));
    } catch (error) {
      return {
        id: 'testsError',
        values: {
          message: error.message,
        },
      };
    }

    await setTimeout(5000);
    const styleCode = getStyleCode(projectPath);
    let errors;
    try {
      console.log('start testing');
      errors = (await Promise.all([
        w3c(projectPath, 'index.html'),
        stylelint(projectPath),
        orderStyles(page, ['fonts.css', 'globals.css']),
        lang(page, lng),
        titleEmmet(page),
        semanticTags(page, ['header', 'main']),
        horizontalScroll(page),
        fonts(path.join(projectPath, 'fonts', 'fonts.css'), ['Inter', 'PressStart2P']),
        variantFontFormats(path.join(projectPath, 'fonts', 'fonts.css'), 'Inter'),
        variantFontWeight(path.join(projectPath, 'fonts', 'fonts.css'), 'Inter'),
        varsDeclAndUsage(styleCode),
        fontVariationSettings(styleCode),
        transition(styleCode),
        background(page),
        filters(page),
        supports(styleCode),
        modal(baseUrl),
      ]))
        .filter(Boolean)
        .flat();
    } catch (error) {
      errors = [
        {
          id: 'testsError',
          values: {
            message: error.message,
          },
        },
      ];
    }

    await browser.close();

    return errors;
  };

  await runTests(options, check);
};

app(PROJECT_PATH, LANG);
