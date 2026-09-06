// Everything the site knows about its owner. Components read this, never hardcode.
// Empty string means "not configured yet": buttons/lines for it are not rendered.
export default {
  // The repo lives in a dedicated GitHub organization, not on a personal account:
  // the résumé must not be reachable from the owner's personal profile.
  site: 'https://danialles.github.io',
  name: 'Даниил Еськов',
  firstName: 'Даниил',
  telegram: 'https://t.me/timbelan',
  // MAX has no link-by-number: this is the profile link copied from the app.
  max: 'https://max.ru/u/f9LHodD0cOKuJickdHliUkhiPH528ksdyVESf7uOv-Po7cn4pLJzY8cpsDA',
  email: 'timbersav91@gmail.com',
  // Deliberately empty: a GitHub link would tie the site to a personal profile.
  github: '',
  city: '',
  timezone: 'МСК (UTC+3)',
  metrikaId: '',
};
