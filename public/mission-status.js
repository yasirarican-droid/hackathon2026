export function renderMissionStatus({ host, mission, data, imageFigure, sources, node }) {
  const spec = data[mission];
  host.append(node('p', 'panel-tag', 'LEFT BEHIND / ORIGINAL NASA EVIDENCE'));
  const title = node('h2', '', 'Where is it now?');
  title.id = 'exhibit-title';
  host.append(title, node('p', 'panel-intro', spec.name + ' · ' + spec.title));
  const catalog = node('a', 'catalog-record', 'NASA NSSDCA Master Catalog · ' + spec.catalog.record + ' ↗');
  catalog.href = spec.catalog.url;
  catalog.target = '_blank';
  catalog.rel = 'noopener noreferrer';
  host.append(catalog, node('p', 'catalog-note', 'Mission identity, hardware and mission history: NSSDCA. Orbital photographs and later research are credited separately below.'));
  const layout = node('div', 'status-layout');
  const visual = node('div', 'status-evidence');
  visual.append(imageFigure(spec.evidence), node('p', 'status-image-note', spec.imageNote));
  const copy = node('div', 'status-copy');
  for (const [label, value] of [['Where', spec.place], ['Condition', spec.condition], ['Why it stayed', spec.reason], ['How the story ended', spec.ending]]) {
    const section = node('section', 'status-fact');
    section.append(node('h3', '', label), node('p', '', value));
    copy.append(section);
  }
  layout.append(visual, copy);
  const question = node('details', 'status-question');
  question.append(node('summary', '', spec.question), node('p', '', spec.answer));
  host.append(layout, question, sources(spec.sources));
}
