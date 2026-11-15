const missions = ['apollo', 'viking', 'sojourner'];
const names = { apollo: 'Apollo 11', viking: 'Viking 1', sojourner: 'Sojourner' };
const topics = { apollo: 'Eagle’s two stages · Lunar science · Returned samples', viking: 'A stationary explorer · Mars weather · Scientific evidence', sojourner: 'Rover teamwork · Mission duration · Camera clues' };
const themes = { gold: { paper: '#fff3cf', ink: '#173d3e', gold: '#bf8b2d', band: '#1c4545' }, night: { paper: '#122b40', ink: '#fff2c6', gold: '#e5bb62', band: '#234758' }, mars: { paper: '#fff0d9', ink: '#5b3327', gold: '#b96a39', band: '#814831' } };
export function certificateRequirements({ items, visited, solved, learning, quizzes, archive, screens, completedMissions = new Set() }) {
  return missions.map(mission => {
    const quiz = mission === 'apollo' ? 'legacy' : mission + '-legacy';
    const totalAnswers = archive.panels[quiz].quiz.length;
    const complete = completedMissions.has(mission) || (quizzes.get(quiz) || 0) >= totalAnswers;
    return { mission, name: names[mission], objects: items[mission].filter(id => visited[mission].has(id)).length, totalObjects: items[mission].length, goals: learning[mission].goals.filter(g => solved.has(mission + ':' + g.id)).length, totalGoals: learning[mission].goals.length, answers: complete ? totalAnswers : Math.min(quizzes.get(quiz) || 0, totalAnswers), totalAnswers, complete, status: screens.has(mission + '-status'), farewell: screens.has(mission + '-signal') };
  });
}
export function certificateEarned(rows) {
  return rows.length > 0 && rows.every(r => r.complete || r.answers === r.totalAnswers);
}
function xml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])); }
function certificateSVG(name, mission, theme) {
  const colors = themes[theme] || themes.gold;
  const displayName = name.trim().slice(0, 60) || 'Curious Explorer';
  const subject = mission ? names[mission].toUpperCase() : 'APOLLO 11 · VIKING 1 · SOJOURNER';
  const detail = mission ? topics[mission] : 'Three mission quizzes · Nine evidence-based questions';
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const fontSize = Math.max(28, Math.min(68, 1000 / Math.max(1, displayName.length * .58)));
  let stars = '';
  for (const [x, y, size] of [[132, 154, 12], [1245, 181, 13], [190, 720, 9], [1210, 710, 9], [234, 123, 6], [1165, 130, 6]]) stars += `<path d="M${x} ${y-size}l${size*.28} ${size*.72} ${size*.72} ${size*.28}-${size*.72} ${size*.28}-${size*.28} ${size*.72}-${size*.28}-${size*.72}-${size*.72}-${size*.28} ${size*.72}-${size*.28}Z" fill="${colors.gold}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990"><rect width="1400" height="990" rx="30" fill="${colors.paper}"/><rect x="28" y="28" width="1344" height="934" rx="22" fill="none" stroke="${colors.ink}" stroke-width="5"/><rect x="45" y="45" width="1310" height="900" rx="15" fill="none" stroke="${colors.gold}" stroke-width="2"/><path d="M70 190H1330M70 799H1330" stroke="${colors.gold}" stroke-width="2"/><path d="M70 70h90M70 70v90M1330 70h-90M1330 70v90M70 920h90M70 920v-90M1330 920h-90M1330 920v-90" stroke="${colors.gold}" stroke-width="5" fill="none"/>${stars}<g text-anchor="middle" fill="${colors.ink}" font-family="Georgia,serif"><text x="700" y="114" font-size="25" letter-spacing="4">ABANDONED, BUT NOT FORGOTTEN</text><text x="700" y="168" font-size="19" letter-spacing="6">SMALL EXPLORERS · BIG DISCOVERIES</text><text x="700" y="276" font-size="49" font-weight="bold">CERTIFICATE OF DISCOVERY</text><text x="700" y="340" font-size="25" font-style="italic">This celebrates the curiosity of</text><text x="700" y="444" font-size="${fontSize}" font-weight="bold">${xml(displayName)}</text><path d="M250 475H1150" stroke="${colors.gold}" stroke-width="2"/><text x="700" y="536" font-size="24">For completing the guided mission quiz</text><text x="700" y="576" font-size="24">and answering questions using real NASA evidence.</text><rect x="240" y="616" width="920" height="63" rx="31" fill="${colors.band}"/><text x="700" y="658" font-size="29" fill="#fff2c6" font-family="Arial,sans-serif" font-weight="bold">${subject}</text><text x="700" y="727" font-size="23">${detail}</text><g transform="translate(700 825)"><circle r="48" fill="${colors.band}" stroke="${colors.gold}" stroke-width="4"/><circle r="37" fill="none" stroke="${colors.gold}" stroke-dasharray="2 5"/><path d="m0-26 7 17 19 2-14 13 4 19L0 15l-16 10 4-19-14-13 19-2Z" fill="${colors.gold}"/></g><text x="270" y="846" font-size="19">${date}</text><text x="1110" y="846" font-size="19">The project team</text><text x="700" y="909" font-size="16" font-family="Arial,sans-serif">Independent educational project award · Not issued by NASA</text></g></svg>`;
}
export function celebrateCertificate(host, node) {
  const celebration = node('div', 'reward-celebration', '✦ Mission complete!');
  celebration.setAttribute('role', 'status');
  host.prepend(celebration);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('motion-paused')) return;
  const burst = node('div', 'reward-confetti');
  burst.setAttribute('aria-hidden', 'true');
  const colors = ['#ffda68', '#80c6b3', '#fa9564', '#fff1c8', '#9dc9ed'];
  for (let i = 0; i < 48; i++) {
    const piece = node('i');
    piece.style.setProperty('--confetti-x', (Math.random() * 100).toFixed(2) + '%');
    piece.style.setProperty('--confetti-drift', (Math.random() * 240 - 120).toFixed(1) + 'px');
    piece.style.setProperty('--confetti-spin', (Math.random() * 900 - 450).toFixed(1) + 'deg');
    piece.style.setProperty('--confetti-delay', (Math.random() * .3).toFixed(2) + 's');
    piece.style.background = colors[i % colors.length];
    burst.append(piece);
  }
  host.prepend(burst);
  setTimeout(() => burst.remove(), 3200);
}
export function renderCertificate({ host, rows, node, action, open, navigate, mission, embedded = false, celebrate = false }) {
  const scoped = mission ? rows.filter(r => r.mission === mission) : rows;
  const earned = certificateEarned(scoped);
  const title = node(embedded ? 'h3' : 'h2', 'certificate-heading', earned ? mission ? names[mission] + ' · Mission complete!' : 'All three missions complete!' : 'Your discovery certificates');
  title.id = embedded ? 'quiz-reward-title' : 'exhibit-title';
  host.append(node('p', 'panel-tag', 'YOUR CURIOSITY DESERVES A REWARD'), title, node('p', 'panel-intro', earned ? 'You answered the mission questions. Make this certificate your own!' : 'Pass each three-question mission quiz to earn its certificate. Pass all three for your complete explorer award. Objects and Field Guide practice are clues, not extra locks.'));
  if (earned) {
    const workshop = node('section', 'certificate-workshop');
    const preview = node('img', 'certificate-preview');
    preview.alt = 'Your personalized independent project discovery certificate';
    const form = node('form', 'certificate-form');
    const label = node('label', '', 'Your name (optional)');
    const input = node('input');
    input.id = 'certificate-name';
    input.maxLength = 60;
    input.placeholder = 'Curious Explorer';
    input.autocomplete = 'off';
    label.htmlFor = input.id;
    const themeLabel = node('label', '', 'Choose your colors');
    const theme = node('select', 'certificate-theme');
    theme.id = 'certificate-theme';
    themeLabel.htmlFor = theme.id;
    for (const [value, text] of [['gold', 'Golden explorer'], ['night', 'Midnight mission'], ['mars', 'Mars copper']]) { const option = node('option', '', text); option.value = value; theme.append(option); }
    const refresh = () => { preview.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(certificateSVG(input.value, mission, theme.value)); };
    input.addEventListener('input', refresh);
    theme.addEventListener('change', refresh);
    const save = node('button', 'paper-button', 'Download my certificate ↓');
    save.type = 'submit';
    form.addEventListener('submit', e => {
      e.preventDefault();
      const url = URL.createObjectURL(new Blob([certificateSVG(input.value, mission, theme.value)], { type: 'image/svg+xml' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = (mission || 'three-mission') + '-discovery-certificate.svg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    form.append(label, input, themeLabel, theme, save, node('small', '', 'Your name stays in this browser. Download the SVG to keep or print your award.'));
    workshop.append(preview, form);
    host.append(workshop);
    refresh();
    if (celebrate) celebrateCertificate(host, node);
  }
  if (!embedded || certificateEarned(rows)) {
    const grid = node('div', 'certificate-checklist');
    for (const row of rows) {
      const card = node('section', 'certificate-mission');
      card.append(node('h3', '', row.name), node('p', '', row.complete ? '✓ Quiz passed · Certificate earned' : row.answers + ' / ' + row.totalAnswers + ' questions answered'));
      card.append(row.complete ? action('View certificate →', () => open('certificate-' + row.mission)) : action('Start this mission quiz →', () => navigate(row.mission)));
      grid.append(card);
    }
    host.append(grid);
  } else {
    const next = rows.find(r => !r.complete);
    if (next) host.append(action('Next mission · ' + next.name + ' →', () => navigate(next.mission)));
    host.append(action('See all my certificates →', () => open('certificate')));
  }
  host.append(node('p', 'certificate-note', 'Earned by completing this guided quiz. This project award does not claim a formal assessment of learning.'));
}
