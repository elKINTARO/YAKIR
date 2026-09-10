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

  'capture.intensity.question': 'Наскільки сильно зараз?',
  'capture.fear.question': 'Чого конкретно ти боїшся, що станеться?',
  'capture.fear.placeholder':
    'Не «мені тривожно», а що саме має статися. Наприклад: «на зустрічі скажуть, що я не тягну проєкт»',
  'capture.fear.hint': 'Схоже на опис стану. Що саме має статися?',
  'capture.fear.dictate': 'Надиктувати',
  'capture.probability.question': 'Наскільки ти зараз віриш, що це станеться?',
  'capture.saved': 'Записано. Завтра о {time} перевіримо, що сталося.',
  'capture.exerciseNow': 'Хочу вправу зараз',

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
