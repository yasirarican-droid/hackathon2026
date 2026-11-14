const missions = ['apollo', 'viking', 'sojourner'];
const names = { apollo: 'Apollo 11', viking: 'Viking 1', sojourner: 'Sojourner' };
export function certificateRequirements({ items, visited, solved, learning, quizzes, archive, screens }) {
  return missions.map(mission => {
    const quiz = mission === 'apollo' ? 'legacy' : mission + '-legacy';
    return {
      mission,
      name: names[mission],
      objects: items[mission].filter(id => visited[mission].has(id)).length,
      totalObjects: items[mission].length,
      goals: learning[mission].goals.filter(g => solved.has(mission + ':' + g.id)).length,
      totalGoals: learning[mission].goals.length,
      answers: Math.min(quizzes.get(quiz) || 0, archive.panels[quiz].quiz.length),
      totalAnswers: archive.panels[quiz].quiz.length,
      status: screens.has(mission + '-status'),
      farewell: screens.has(mission + '-signal'),
    };
  });
}
export function certificateEarned(rows) {
  return rows.every(r => r.objects === r.totalObjects && r.goals === r.totalGoals && r.answers === r.totalAnswers && r.status && r.farewell);
}
function downloadCertificate(name) {
  const safe = name.trim().slice(0, 60).replace(/[<>&"']/g, '') || 'Curious Explorer';
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="990" viewBox="0 0 1400 990"><rect width="1400" height="990" fill="#fff2cc"/><rect x="35" y="35" width="1330" height="920" rx="24" fill="none" stroke="#244c46" stroke-width="8"/><rect x="53" y="53" width="1294" height="884" rx="18" fill="none" stroke="#c59134" stroke-width="2"/><g fill="#244c46" text-anchor="middle" font-family="Arial,sans-serif"><text x="700" y="135" font-size="25" letter-spacing="4">ABANDONED, BUT NOT FORGOTTEN</text><text x="700" y="240" font-size="54" font-weight="bold">CERTIFICATE OF EXPLORATION</text><text x="700" y="321" font-size="26">Awarded to</text><text x="700" y="409" font-size="44" font-weight="bold" textLength="${Math.min(1050, Math.max(180, safe.length * 25))}" lengthAdjust="spacingAndGlyphs">${safe}</text><path d="M300 448H1100" stroke="#c59134" stroke-width="3"/><text x="700" y="515" font-size="27">For exploring all three mission archives, investigating the evidence,</text><text x="700" y="560" font-size="27">and completing every Field Guide and discovery question.</text><text x="700" y="650" font-size="32" font-weight="bold">APOLLO 11 · VIKING 1 · SOJOURNER</text><text x="700" y="729" font-size="25">Keep asking questions. Every quiet explorer still has a story.</text><text x="700" y="810" font-size="23">${date} · Abandoned, But Not Forgotten project team</text><text x="700" y="878" font-size="18">Independent educational project · Not a NASA-issued certificate or assessment of learning.</text></g></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-space-explorer-certificate.svg';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function renderCertificate({ host, rows, node, action, open, navigate }) {
  const earned = certificateEarned(rows);
  host.append(node('p', 'panel-tag', 'YOUR EXPLORER JOURNEY'));
  const title = node('h2', '', earned ? 'You are an Evidence Explorer!' : 'Your explorer certificate');
  title.id = 'exhibit-title';
  host.append(title, node('p', 'panel-intro', earned ? 'Three quiet explorers. All the evidence investigated. This certificate celebrates your curiosity.' : 'Explore each mission’s objects, answer its questions, read Where is it now? and finish Last Signal. Your checklist is saved on this device when storage is available.'));
  if (earned) {
    const form = node('form', 'certificate-form');
    const label = node('label', '', 'Name on your certificate (optional)');
    const input = node('input');
    input.id = 'certificate-name';
    input.maxLength = 60;
    input.placeholder = 'Curious Explorer';
    input.autocomplete = 'off';
    label.htmlFor = input.id;
    const save = node('button', 'paper-button', 'Download my certificate ↓');
    save.type = 'submit';
    form.addEventListener('submit', e => { e.preventDefault(); downloadCertificate(input.value); });
    form.append(label, input, save, node('small', '', 'Your name stays in this browser and is not saved or sent to a server. Downloaded SVG can be opened and printed.'));
    host.append(form);
  }
  const grid = node('div', 'certificate-checklist');
  for (const row of rows) {
    const card = node('section', 'certificate-mission');
    card.append(node('h3', '', row.name));
    for (const text of [`${row.objects} / ${row.totalObjects} objects explored`, `${row.goals} / ${row.totalGoals} Field Guide answers`, `${row.answers} / ${row.totalAnswers} discovery answers`, `${row.status ? '✓' : '○'} Where is it now?`, `${row.farewell ? '✓' : '○'} Last Signal story completed`]) card.append(node('p', '', text));
    if (!earned) {
      card.append(action('Continue this mission →', () => navigate(row.mission)));
      if (!row.status) card.append(action('Where is it now? →', () => open(row.mission + '-status')));
    }
    grid.append(card);
  }
  host.append(grid, node('p', 'certificate-note', 'An independent project certificate, not a NASA award. Opening objects records visits; it does not prove learning or require watching every animation.'));
}
