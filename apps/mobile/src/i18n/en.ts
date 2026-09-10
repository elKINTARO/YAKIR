import type { Dictionary } from './uk';

export const en: Dictionary = {
  'common.done': 'Done',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.save': 'Save',
  'common.close': 'Close',

  'home.capture': 'Record',
  'home.pendingTitle': 'Yesterday you predicted',
  'home.pendingAction': 'Check',

  'capture.intensity.question': 'How strong is it right now?',
  'capture.fear.question': 'What exactly are you afraid will happen?',
  'capture.fear.placeholder':
    'Not "I feel anxious", but what is supposed to happen. For example: "at the meeting they will say I cannot handle the project"',
  'capture.fear.hint': 'That reads as a state. What is supposed to happen?',
  'capture.fear.dictate': 'Dictate',
  'capture.probability.question':
    'How much do you believe right now that it will happen?',
  'capture.saved': 'Recorded. Tomorrow at {time} we will check what happened.',
  'capture.exerciseNow': 'An exercise now',

  'followup.stated': 'You put it at {probability}%',
  'followup.question': 'What happened?',
  'followup.outcome.didNotHappen': 'Did not happen',
  'followup.outcome.partly': 'Partly',
  'followup.outcome.happened': 'Happened',
  'followup.impact.question': 'How bad did it actually turn out?',
  'followup.helped.question': 'What helped you then?',
  'followup.reflection.didNotHappen':
    'The prediction did not come true. That is the {ordinal} such case out of {total}.',
  'followup.reflection.lighterThanFeared':
    'It happened, but by your own account it turned out lighter ({impact}/10) than it felt at the time ({intensity}/10).',
  'followup.reflection.asHardAsFeared':
    'It happened, and it was genuinely hard. You got through it.',

  'stats.calibration.title': 'Your predictions',
  'stats.calibration.meanProbability': 'Average stated confidence',
  'stats.calibration.fully': 'Came true fully',
  'stats.calibration.partly': 'Came true partly',
  'stats.calibration.ratio': '{count} of {total}',
  'stats.calibration.insufficient':
    '{remaining} more checks and your prediction statistics will appear here.',

  'tag.work': 'work',
  'tag.health': 'health',
  'tag.relationships': 'relationships',
  'tag.money': 'money',
  'tag.social': 'social',
  'tag.future': 'future',
  'tag.other': 'other',
};
