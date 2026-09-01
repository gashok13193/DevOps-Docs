// Country data for the flag ranking board.
// flag: flagcdn.com code (iso2, or special UK sub-region / territory codes it also supports)
// aliases: extra words/phrases (besides the lowercase name) that should also count as a match in chat.
const COUNTRIES = [
  { code: 'af', name: 'Afghanistan', aliases: [] },
  { code: 'ax', name: 'Aland Islands', aliases: ['aland'] },
  { code: 'al', name: 'Albania', aliases: [] },
  { code: 'dz', name: 'Algeria', aliases: [] },
  { code: 'ad', name: 'Andorra', aliases: [] },
  { code: 'ao', name: 'Angola', aliases: [] },
  { code: 'ag', name: 'Antigua and Barbuda', aliases: ['antigua'] },
  { code: 'ar', name: 'Argentina', aliases: [] },
  { code: 'am', name: 'Armenia', aliases: [] },
  { code: 'aw', name: 'Aruba', aliases: [] },
  { code: 'au', name: 'Australia', aliases: ['aussie'] },
  { code: 'at', name: 'Austria', aliases: [] },
  { code: 'az', name: 'Azerbaijan', aliases: [] },
  { code: 'bs', name: 'Bahamas', aliases: ['the bahamas'] },
  { code: 'bh', name: 'Bahrain', aliases: [] },
  { code: 'bd', name: 'Bangladesh', aliases: [] },
  { code: 'bb', name: 'Barbados', aliases: [] },
  { code: 'by', name: 'Belarus', aliases: [] },
  { code: 'be', name: 'Belgium', aliases: [] },
  { code: 'bz', name: 'Belize', aliases: [] },
  { code: 'bj', name: 'Benin', aliases: [] },
  { code: 'bm', name: 'Bermuda', aliases: [] },
  { code: 'bt', name: 'Bhutan', aliases: [] },
  { code: 'bo', name: 'Bolivia', aliases: [] },
  { code: 'bq', name: 'Bonaire, Sint Eustatius and Saba', aliases: ['bonaire', 'sint eustatius', 'saba'] },
  { code: 'ba', name: 'Bosnia and Herzegovina', aliases: ['bosnia', 'herzegovina'] },
  { code: 'bw', name: 'Botswana', aliases: [] },
  { code: 'br', name: 'Brazil', aliases: [] },
  { code: 'bn', name: 'Brunei', aliases: [] },
  { code: 'bg', name: 'Bulgaria', aliases: [] },
  { code: 'bf', name: 'Burkina Faso', aliases: [] },
  { code: 'bi', name: 'Burundi', aliases: [] },
  { code: 'cv', name: 'Cabo Verde', aliases: ['cape verde'] },
  { code: 'kh', name: 'Cambodia', aliases: [] },
  { code: 'cm', name: 'Cameroon', aliases: [] },
  { code: 'ca', name: 'Canada', aliases: [] },
  { code: 'ky', name: 'Cayman Islands', aliases: ['cayman'] },
  { code: 'cf', name: 'Central African Republic', aliases: [] },
  { code: 'td', name: 'Chad', aliases: [] },
  { code: 'cl', name: 'Chile', aliases: [] },
  { code: 'cn', name: 'China', aliases: [] },
  { code: 'cx', name: 'Christmas Island', aliases: [] },
  { code: 'cc', name: 'Cocos Islands', aliases: ['cocos (keeling) islands', 'cocos keeling islands'] },
  { code: 'co', name: 'Colombia', aliases: [] },
  { code: 'km', name: 'Comoros', aliases: [] },
  { code: 'cg', name: 'Congo', aliases: ['republic of congo'] },
  { code: 'cd', name: 'DR Congo', aliases: ['dr congo', 'democratic republic of congo', 'congo kinshasa'] },
  { code: 'ck', name: 'Cook Islands', aliases: [] },
  { code: 'cr', name: 'Costa Rica', aliases: [] },
  { code: 'ci', name: "Cote d'Ivoire", aliases: ['ivory coast', 'cote divoire'] },
  { code: 'hr', name: 'Croatia', aliases: [] },
  { code: 'cu', name: 'Cuba', aliases: [] },
  { code: 'cw', name: 'Curacao', aliases: [] },
  { code: 'cy', name: 'Cyprus', aliases: [] },
  { code: 'cz', name: 'Czech Republic', aliases: ['czechia'] },
  { code: 'dk', name: 'Denmark', aliases: [] },
  { code: 'dj', name: 'Djibouti', aliases: [] },
  { code: 'dm', name: 'Dominica', aliases: [] },
  { code: 'do', name: 'Dominican Republic', aliases: [] },
  { code: 'ec', name: 'Ecuador', aliases: [] },
  { code: 'eg', name: 'Egypt', aliases: [] },
  { code: 'sv', name: 'El Salvador', aliases: ['salvador'] },
  { code: 'gq', name: 'Equatorial Guinea', aliases: [] },
  { code: 'er', name: 'Eritrea', aliases: [] },
  { code: 'ee', name: 'Estonia', aliases: [] },
  { code: 'sz', name: 'Eswatini', aliases: ['swaziland'] },
  { code: 'et', name: 'Ethiopia', aliases: [] },
  { code: 'fj', name: 'Fiji', aliases: [] },
  { code: 'fi', name: 'Finland', aliases: [] },
  { code: 'fr', name: 'France', aliases: [] },
  { code: 'ga', name: 'Gabon', aliases: [] },
  { code: 'gm', name: 'Gambia', aliases: ['the gambia'] },
  { code: 'ge', name: 'Georgia', aliases: [] },
  { code: 'de', name: 'Germany', aliases: [] },
  { code: 'gh', name: 'Ghana', aliases: [] },
  { code: 'gr', name: 'Greece', aliases: [] },
  { code: 'gd', name: 'Grenada', aliases: [] },
  { code: 'gt', name: 'Guatemala', aliases: [] },
  { code: 'gn', name: 'Guinea', aliases: [] },
  { code: 'gw', name: 'Guinea-Bissau', aliases: [] },
  { code: 'gy', name: 'Guyana', aliases: [] },
  { code: 'ht', name: 'Haiti', aliases: [] },
  { code: 'hn', name: 'Honduras', aliases: [] },
  { code: 'hk', name: 'Hong Kong', aliases: [] },
  { code: 'hu', name: 'Hungary', aliases: [] },
  { code: 'is', name: 'Iceland', aliases: [] },
  { code: 'in', name: 'India', aliases: [] },
  { code: 'id', name: 'Indonesia', aliases: [] },
  { code: 'ir', name: 'Iran', aliases: [] },
  { code: 'iq', name: 'Iraq', aliases: [] },
  { code: 'ie', name: 'Ireland', aliases: [] },
  { code: 'il', name: 'Israel', aliases: [] },
  { code: 'it', name: 'Italy', aliases: [] },
  { code: 'jm', name: 'Jamaica', aliases: [] },
  { code: 'jp', name: 'Japan', aliases: [] },
  { code: 'jo', name: 'Jordan', aliases: [] },
  { code: 'kz', name: 'Kazakhstan', aliases: [] },
  { code: 'ke', name: 'Kenya', aliases: [] },
  { code: 'ki', name: 'Kiribati', aliases: [] },
  { code: 'xk', name: 'Kosovo', aliases: [] },
  { code: 'kw', name: 'Kuwait', aliases: [] },
  { code: 'kg', name: 'Kyrgyzstan', aliases: [] },
  { code: 'la', name: 'Laos', aliases: [] },
  { code: 'lv', name: 'Latvia', aliases: [] },
  { code: 'lb', name: 'Lebanon', aliases: [] },
  { code: 'ls', name: 'Lesotho', aliases: [] },
  { code: 'lr', name: 'Liberia', aliases: [] },
  { code: 'ly', name: 'Libya', aliases: [] },
  { code: 'li', name: 'Liechtenstein', aliases: [] },
  { code: 'lt', name: 'Lithuania', aliases: [] },
  { code: 'lu', name: 'Luxembourg', aliases: [] },
  { code: 'mg', name: 'Madagascar', aliases: [] },
  { code: 'mw', name: 'Malawi', aliases: [] },
  { code: 'my', name: 'Malaysia', aliases: [] },
  { code: 'mv', name: 'Maldives', aliases: [] },
  { code: 'ml', name: 'Mali', aliases: [] },
  { code: 'mt', name: 'Malta', aliases: [] },
  { code: 'mh', name: 'Marshall Islands', aliases: [] },
  { code: 'mr', name: 'Mauritania', aliases: [] },
  { code: 'mu', name: 'Mauritius', aliases: [] },
  { code: 'mx', name: 'Mexico', aliases: [] },
  { code: 'fm', name: 'Micronesia', aliases: [] },
  { code: 'md', name: 'Moldova', aliases: [] },
  { code: 'mc', name: 'Monaco', aliases: [] },
  { code: 'mn', name: 'Mongolia', aliases: [] },
  { code: 'me', name: 'Montenegro', aliases: [] },
  { code: 'ma', name: 'Morocco', aliases: [] },
  { code: 'mz', name: 'Mozambique', aliases: [] },
  { code: 'mm', name: 'Myanmar', aliases: ['burma'] },
  { code: 'na', name: 'Namibia', aliases: [] },
  { code: 'nr', name: 'Nauru', aliases: [] },
  { code: 'np', name: 'Nepal', aliases: [] },
  { code: 'nl', name: 'Netherlands', aliases: ['holland'] },
  { code: 'nz', name: 'New Zealand', aliases: [] },
  { code: 'ni', name: 'Nicaragua', aliases: [] },
  { code: 'ne', name: 'Niger', aliases: [] },
  { code: 'ng', name: 'Nigeria', aliases: [] },
  { code: 'kp', name: 'North Korea', aliases: [] },
  { code: 'mk', name: 'North Macedonia', aliases: ['macedonia'] },
  { code: 'no', name: 'Norway', aliases: [] },
  { code: 'om', name: 'Oman', aliases: [] },
  { code: 'pk', name: 'Pakistan', aliases: [] },
  { code: 'pw', name: 'Palau', aliases: [] },
  { code: 'ps', name: 'Palestine', aliases: [] },
  { code: 'pa', name: 'Panama', aliases: [] },
  { code: 'pg', name: 'Papua New Guinea', aliases: [] },
  { code: 'py', name: 'Paraguay', aliases: [] },
  { code: 'pe', name: 'Peru', aliases: [] },
  { code: 'ph', name: 'Philippines', aliases: [] },
  { code: 'pl', name: 'Poland', aliases: [] },
  { code: 'pt', name: 'Portugal', aliases: [] },
  { code: 'qa', name: 'Qatar', aliases: [] },
  { code: 'ro', name: 'Romania', aliases: [] },
  { code: 'ru', name: 'Russia', aliases: ['russian federation'] },
  { code: 'rw', name: 'Rwanda', aliases: [] },
  { code: 'kn', name: 'Saint Kitts and Nevis', aliases: [] },
  { code: 'lc', name: 'Saint Lucia', aliases: [] },
  { code: 'vc', name: 'Saint Vincent and the Grenadines', aliases: [] },
  { code: 'ws', name: 'Samoa', aliases: [] },
  { code: 'sm', name: 'San Marino', aliases: [] },
  { code: 'st', name: 'Sao Tome and Principe', aliases: [] },
  { code: 'sa', name: 'Saudi Arabia', aliases: [] },
  { code: 'sn', name: 'Senegal', aliases: [] },
  { code: 'rs', name: 'Serbia', aliases: [] },
  { code: 'sc', name: 'Seychelles', aliases: [] },
  { code: 'sl', name: 'Sierra Leone', aliases: [] },
  { code: 'sg', name: 'Singapore', aliases: [] },
  { code: 'sk', name: 'Slovakia', aliases: [] },
  { code: 'si', name: 'Slovenia', aliases: [] },
  { code: 'sb', name: 'Solomon Islands', aliases: [] },
  { code: 'so', name: 'Somalia', aliases: [] },
  { code: 'za', name: 'South Africa', aliases: [] },
  { code: 'kr', name: 'South Korea', aliases: ['korea'] },
  { code: 'ss', name: 'South Sudan', aliases: [] },
  { code: 'es', name: 'Spain', aliases: [] },
  { code: 'lk', name: 'Sri Lanka', aliases: [] },
  { code: 'sd', name: 'Sudan', aliases: [] },
  { code: 'sr', name: 'Suriname', aliases: [] },
  { code: 'se', name: 'Sweden', aliases: [] },
  { code: 'ch', name: 'Switzerland', aliases: [] },
  { code: 'sy', name: 'Syria', aliases: [] },
  { code: 'tw', name: 'Taiwan', aliases: [] },
  { code: 'tj', name: 'Tajikistan', aliases: [] },
  { code: 'tz', name: 'Tanzania', aliases: [] },
  { code: 'th', name: 'Thailand', aliases: [] },
  { code: 'tl', name: 'Timor-Leste', aliases: ['east timor'] },
  { code: 'tg', name: 'Togo', aliases: [] },
  { code: 'to', name: 'Tonga', aliases: [] },
  { code: 'tt', name: 'Trinidad and Tobago', aliases: ['trinidad'] },
  { code: 'tn', name: 'Tunisia', aliases: [] },
  { code: 'tr', name: 'Turkey', aliases: ['turkiye'] },
  { code: 'tm', name: 'Turkmenistan', aliases: [] },
  { code: 'tv', name: 'Tuvalu', aliases: [] },
  { code: 'ug', name: 'Uganda', aliases: [] },
  { code: 'ua', name: 'Ukraine', aliases: [] },
  { code: 'ae', name: 'United Arab Emirates', aliases: ['uae'] },
  { code: 'gb', name: 'United Kingdom', aliases: ['uk', 'britain', 'great britain'] },
  { code: 'gb-eng', name: 'England', aliases: [] },
  { code: 'gb-sct', name: 'Scotland', aliases: [] },
  { code: 'gb-wls', name: 'Wales', aliases: [] },
  { code: 'gb-nir', name: 'Northern Ireland', aliases: [] },
  { code: 'us', name: 'United States', aliases: ['usa', 'america', 'united states of america'] },
  { code: 'uy', name: 'Uruguay', aliases: [] },
  { code: 'uz', name: 'Uzbekistan', aliases: [] },
  { code: 'vu', name: 'Vanuatu', aliases: [] },
  { code: 'va', name: 'Vatican City', aliases: ['vatican'] },
  { code: 've', name: 'Venezuela', aliases: [] },
  { code: 'vn', name: 'Vietnam', aliases: [] },
  { code: 'ye', name: 'Yemen', aliases: [] },
  { code: 'zm', name: 'Zambia', aliases: [] },
  { code: 'zw', name: 'Zimbabwe', aliases: [] },
  { code: 'ai', name: 'Anguilla', aliases: [] },
  { code: 'aq', name: 'Antarctica', aliases: [] },
  { code: 'as', name: 'American Samoa', aliases: [] },
  { code: 'bv', name: 'Bouvet Island', aliases: [] },
  { code: 'io', name: 'British Indian Ocean Territory', aliases: [] },
  { code: 'vg', name: 'British Virgin Islands', aliases: ['virgin islands'] },
  { code: 'fk', name: 'Falkland Islands', aliases: [] },
  { code: 'fo', name: 'Faroe Islands', aliases: [] },
  { code: 'gf', name: 'French Guiana', aliases: [] },
  { code: 'pf', name: 'French Polynesia', aliases: [] },
  { code: 'tf', name: 'French Southern Territories', aliases: [] },
  { code: 'gi', name: 'Gibraltar', aliases: [] },
  { code: 'gl', name: 'Greenland', aliases: [] },
  { code: 'gp', name: 'Guadeloupe', aliases: [] },
  { code: 'gu', name: 'Guam', aliases: [] },
  { code: 'gg', name: 'Guernsey', aliases: [] },
  { code: 'hm', name: 'Heard Island and McDonald Islands', aliases: ['heard island'] },
  { code: 'im', name: 'Isle of Man', aliases: [] },
  { code: 'je', name: 'Jersey', aliases: [] },
  { code: 'mo', name: 'Macao', aliases: ['macau'] },
  { code: 'mq', name: 'Martinique', aliases: [] },
  { code: 'yt', name: 'Mayotte', aliases: [] },
  { code: 'ms', name: 'Montserrat', aliases: [] },
  { code: 'nc', name: 'New Caledonia', aliases: [] },
  { code: 'nu', name: 'Niue', aliases: [] },
  { code: 'nf', name: 'Norfolk Island', aliases: [] },
  { code: 'mp', name: 'Northern Mariana Islands', aliases: ['northern marianas'] },
  { code: 'pn', name: 'Pitcairn Islands', aliases: ['pitcairn'] },
  { code: 'pr', name: 'Puerto Rico', aliases: [] },
  { code: 're', name: 'Reunion', aliases: [] },
  { code: 'bl', name: 'Saint Barthelemy', aliases: ['saint barthelemy'] },
  { code: 'sh', name: 'Saint Helena', aliases: [] },
  { code: 'mf', name: 'Saint Martin', aliases: [] },
  { code: 'pm', name: 'Saint Pierre and Miquelon', aliases: [] },
  { code: 'sx', name: 'Sint Maarten', aliases: [] },
  { code: 'gs', name: 'South Georgia and the South Sandwich Islands', aliases: ['south georgia'] },
  { code: 'sj', name: 'Svalbard and Jan Mayen', aliases: ['svalbard'] },
  { code: 'tk', name: 'Tokelau', aliases: [] },
  { code: 'tc', name: 'Turks and Caicos Islands', aliases: ['turks and caicos'] },
  { code: 'um', name: 'United States Minor Outlying Islands', aliases: [] },
  { code: 'vi', name: 'United States Virgin Islands', aliases: ['us virgin islands'] },
  { code: 'wf', name: 'Wallis and Futuna', aliases: [] },
  { code: 'eh', name: 'Western Sahara', aliases: [] },
];

// Escape a string for safe use inside a RegExp.
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a flat, longest-first list of { pattern, code } used for chat matching.
function buildCountryMatchers() {
  const matchers = [];
  for (const c of COUNTRIES) {
    const terms = [c.name.toLowerCase(), ...c.aliases.map(a => a.toLowerCase())];
    for (const term of terms) {
      matchers.push({ term, code: c.code });
    }
  }
  // Longest term first so "south korea" is checked before "korea".
  matchers.sort((a, b) => b.term.length - a.term.length);
  return matchers.map(m => {
    const compactTerm = m.term.replace(/\s+/g, '');
    return {
      regex: new RegExp('\\b' + escapeRegExp(m.term) + '\\b', 'i'),
      repeatedRegex: new RegExp('(?:' + escapeRegExp(m.term) + '){2,}', 'i'),
      compactRepeatedRegex: compactTerm === m.term ? null : new RegExp('(?:' + escapeRegExp(compactTerm) + '){2,}', 'i'),
      fuzzyTerm: /^[a-z]{5,}$/.test(m.term) ? m.term : null,
      code: m.code,
    };
  });
}

const COUNTRY_MATCHERS = buildCountryMatchers();
const COUNTRY_CODES = new Set(COUNTRIES.map(country => country.code));

function damerauLevenshteinDistance(first, second) {
  const distances = Array.from({ length: first.length + 1 }, (_, row) => [row]);
  for (let column = 0; column <= second.length; column++) distances[0][column] = column;

  for (let row = 1; row <= first.length; row++) {
    for (let column = 1; column <= second.length; column++) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1;
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + cost,
      );
      if (row > 1 && column > 1 && first[row - 1] === second[column - 2] && first[row - 2] === second[column - 1]) {
        distances[row][column] = Math.min(distances[row][column], distances[row - 2][column - 2] + 1);
      }
    }
  }
  return distances[first.length][second.length];
}

function findCountryWithMinorTypo(text) {
  const words = text.match(/[a-z]{5,}/g) || [];
  for (const word of words) {
    for (const matcher of COUNTRY_MATCHERS) {
      if (matcher.fuzzyTerm && Math.abs(word.length - matcher.fuzzyTerm.length) <= 1
        && damerauLevenshteinDistance(word, matcher.fuzzyTerm) <= 1) return matcher.code;
    }
  }
  return null;
}

function findCountryFlagEmoji(text) {
  const flags = text.matchAll(/[\u{1F1E6}-\u{1F1FF}]{2}/gu);
  for (const match of flags) {
    const [firstSymbol, secondSymbol] = [...match[0]];
    const first = firstSymbol.codePointAt(0);
    const second = secondSymbol.codePointAt(0);

    const code = String.fromCharCode(first - 0x1F1E6 + 65, second - 0x1F1E6 + 65).toLowerCase();
    if (COUNTRY_CODES.has(code)) return code;
  }
  return null;
}

// Returns the country code of the first country name or standard flag emoji found in text.
function findCountryInText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const m of COUNTRY_MATCHERS) {
    if (m.regex.test(lower)) return m.code;
  }
  for (const m of COUNTRY_MATCHERS) {
    if (m.repeatedRegex.test(lower) || (m.compactRepeatedRegex && m.compactRepeatedRegex.test(lower))) return m.code;
  }
  return findCountryWithMinorTypo(lower) || findCountryFlagEmoji(text);
}

// Also usable from Node (server.js) via require('./js/countries.js'); no-op in the browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COUNTRIES, findCountryInText };
}
