export const uk = {
  'common.done': 'Готово',
  'common.cancel': 'Скасувати',
  'common.back': 'Назад',
  'common.next': 'Далі',
  'common.save': 'Зберегти',
  'common.close': 'Закрити',

  'home.capture': 'Зафіксувати',
  'home.pendingTitle': 'Вчора ти передбачав',
  'home.pendingAction': 'Перевірити',

  'capture.step': 'Крок {current} з {total}',
  'capture.scale.untouched': 'Торкнись шкали',
  'capture.intensity.question': 'Наскільки сильно зараз?',
  'capture.fear.question': 'Чого конкретно ти боїшся, що станеться?',
  'capture.fear.placeholder':
    'Не «мені тривожно», а що саме має статися. Наприклад: «на зустрічі скажуть, що я не тягну проєкт»',
  'capture.fear.hint': 'Схоже на опис стану. Що саме має статися?',
  'capture.fear.dictate': 'Надиктувати',
  'capture.fear.stopDictation': 'Зупинити',
  'capture.fear.tags': 'Тема, якщо хочеш',
  'capture.probability.question': 'Наскільки ти зараз віриш, що це станеться?',
  'capture.saveFailed': 'Не вдалося зберегти. Спробуй ще раз.',
  'capture.saved.tomorrow': 'Записано. Завтра о {time} перевіримо, що сталося.',
  'capture.saved.dayAfterTomorrow':
    'Записано. Післязавтра о {time} перевіримо, що сталося.',
  'capture.exerciseNow': 'Хочу вправу зараз',

  'exercises.title': 'Вправи',

  'notify.channel': 'Перевірка прогнозів',
  'notify.followup.title': 'Час перевірити прогноз',
  'notify.followup.body': 'Що сталося насправді?',
  'notify.summary.one': 'Є {count} прогноз для перевірки',
  'notify.summary.few': 'Є {count} прогнози для перевірки',
  'notify.summary.many': 'Є {count} прогнозів для перевірки',
  'notify.disabledHint':
    'Нагадування вимкнені. Перевірка однаково чекатиме на головному екрані.',

  'followup.stated': 'Ти оцінював це у {probability}%',
  'followup.question': 'Що сталося?',
  'followup.outcome.didNotHappen': 'Не сталося',
  'followup.outcome.partly': 'Частково',
  'followup.outcome.happened': 'Сталося',
  'followup.impact.question': 'Наскільки погано вийшло насправді?',
  'followup.helped.question': 'Що допомогло тобі тоді?',
  'followup.reflection.didNotHappen':
    'Прогноз не справдився. Це {ordinal}-й такий випадок із {total}.',
  'followup.reflection.lighterThanFeared':
    'Сталося, але за твоєю оцінкою це виявилось легше ({impact}/10), ніж відчувалося тоді ({intensity}/10).',
  'followup.reflection.asHardAsFeared':
    'Сталося, і було справді важко. Ти це пережив.',

  'stats.calibration.title': 'Твої прогнози',
  'stats.calibration.meanProbability': 'Середня заявлена впевненість',
  'stats.calibration.fully': 'Справдилось повністю',
  'stats.calibration.partly': 'Справдилось частково',
  'stats.calibration.ratio': '{count} з {total}',
  'stats.calibration.insufficient':
    'Ще {remaining} перевірок, і тут зʼявиться твоя статистика прогнозів.',

  'tag.work': 'робота',
  'tag.health': 'здоровʼя',
  'tag.relationships': 'стосунки',
  'tag.money': 'гроші',
  'tag.social': 'соціальне',
  'tag.future': 'майбутнє',
  'tag.other': 'інше',
} as const;

export type TranslationKey = keyof typeof uk;
export type Dictionary = Record<TranslationKey, string>;
