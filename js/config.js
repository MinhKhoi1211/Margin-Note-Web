/**
 * Configuration & Utility Helpers
 */
const $ = s => document.querySelector(s);

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[c]));

const T = {
  col: {
    n: 'Collocations & phrases',
    ph: 'heavy rain',
    l: ['Collocation, phrasal verb or idiom', 'Meaning or note', 'Example sentence'],
    tags: ['verb + noun', 'adjective + noun', 'noun + noun', 'adverb + adjective', 'verb + adverb', 'verb + preposition', 'phrasal verb', 'idiom', 'fixed expression']
  },
  err: {
    n: 'Error log',
    ph: 'I am agree with you.',
    l: ['What I wrote', 'Correct version', 'Why it was wrong'],
    tags: ['grammar', 'preposition', 'article', 'tense', 'word choice', 'spelling', 'punctuation', 'pronunciation']
  },
  voc: {
    n: 'Words',
    ph: 'reluctant',
    l: ['Word', 'Meaning', 'Example sentence'],
    tags: ['noun', 'verb', 'adjective', 'adverb', 'work', 'daily life']
  },
  gra: {
    n: 'Grammar',
    ph: 'Present perfect vs past simple',
    l: ['Topic', 'Rule in my own words', 'Example'],
    tags: ['tenses', 'articles', 'conditionals', 'modals', 'word order']
  }
};

const EMPTY = {
  col: 'Add the pairs, phrasal verbs and idioms you notice, like "heavy rain", "come across" or "break the ice".',
  err: 'Log a mistake you made or were corrected on: what you wrote, then the fix.',
  voc: 'New words go here with a meaning and a sentence of your own.',
  gra: 'Short rules, written the way you would explain them to a friend.'
};

const RT = ['col', 'err', 'voc'];
const KEY = 'margin-notes-v1';
