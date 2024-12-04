export default {
  translation: {
    semanticTagsMissing: 'Отсутствуют семантические теги: `{{ tagNames }}`.',
    fontsMissing: 'Отсутствуют шрифты: `{{ fontNames }}`.',
    variantFontFormatMissing: 'При подключении вариативного шрифта не указаны форматы: `{{ formats }}`.',
    variantFontWeightMissing: 'Вариативному шрифту не заданы при импорте (в файле fonts.css) все начертания. Укажите начертания: `{{ weights }}`.',
    varsNotDeclOrNotUsage: 'CSS-переменные не заданы или не используются.',
    fontVariationSettingsMissing: 'Отсутствуют настройки вариативных шрифтов. Укажите свойство `font-variation-settings`.',
    transition: 'Запрещено использовать значение `all` в свойствах `transition` и `transition-property`.',
    backgroundUrl: 'Фон страницы не должен использовать SVG-паттерны.',
    filters: {
      missing: 'Картинки карточек не стилизованы CSS-фильтрами. Картинки должны быть свёрстаны с помощью тега `img`.',
      unique: 'Минимум на семи картинках должны быть разные фильтры.',
      multiple: 'Ни один из фильтров не множественный.',
    },
    supports: 'Поддержка `text-stroke` и `-webkit-text-stroke` не проверена директивой `@supports`.',
    modal: {
      saveButtonMissing: 'Не найдена кнопка "Сохранить на память".',
      dialogMissing: 'Модальное окно сделать с помощью элемента `dialog`.',
      notShown: 'Модальное окно появляется при клике на кнопку "Сохранить на память". Меняйте свойство `display` у диалога в состоянии `opened`.',
      okButtonMissing: 'Не найдена кнопка "Ок" внутри модального окна.',
      notHidden: 'Модальное окно должно закрываться, при нажатии на кнопку "Ок". Страница обновляться не должна.',
    },
    testsError: 'Ошибка во время выполнения тестов: {{ message }}',
  },
};
