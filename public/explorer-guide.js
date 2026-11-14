export function createExplorerGuide({ asset, context, open, navigate, idleMs = 45000, repeatMs = 120000, visibleMs = 14000 }) {
  const cast = {
    home: ['Your little space explorer', 'guide-astronaut.webp'],
    apollo: ['Eagle', 'guide-eagle.webp'],
    viking: ['Viking 1', 'guide-viking.webp'],
    sojourner: ['Your little rover', 'guide-sojourner.webp'],
  };
  const root = document.createElement('aside');
  root.className = 'explorer-guide';
  root.id = 'explorer-tip';
  root.hidden = true;
  root.setAttribute('aria-label', 'Explorer tip');
  root.innerHTML = '<img class="guide-character" alt=""><div class="guide-bubble"><button class="guide-close" aria-label="Dismiss explorer tip">×</button><span class="guide-name"></span><p class="guide-message" role="status" aria-live="polite"></p><button class="guide-action"></button><button class="guide-disable">Hide automatic tips for this visit</button></div>';
  document.querySelector('#application').append(root);
  const help = document.createElement('button');
  help.className = 'guide-help';
  help.textContent = '?';
  help.title = 'Ask your explorer guide';
  help.setAttribute('aria-label', 'Ask your explorer guide for another tip');
  help.setAttribute('aria-controls', root.id);
  help.setAttribute('aria-expanded', 'false');
  document.querySelector('#application').append(help);
  const image = root.querySelector('img');
  const message = root.querySelector('.guide-message');
  const action = root.querySelector('.guide-action');
  const counts = new Map();
  const tipIndices = new Map();
  let key;
  let lastActivity = performance.now();
  let nextAllowed = 0;
  let shownAt = 0;
  let disabled = false;
  let previousFocus;
  let runAction;
  function hide() {
    const hadFocus = root.contains(document.activeElement);
    root.hidden = true;
    help.setAttribute('aria-expanded', 'false');
    if (hadFocus && previousFocus?.isConnected && previousFocus.getClientRects().length)
      previousFocus.focus({ preventScroll: true });
  }
  function reset() {
    hide();
    lastActivity = performance.now();
  }
  function show(state, manual = false) {
    const iteration = tipIndices.get(state.page) || 0;
    const [name, file] = cast[state.page];
    root.dataset.guide = state.page;
    image.src = asset('assets/art/' + file);
    root.querySelector('.guide-name').textContent = name;
    const panelTip = (text, label, panel) => [text, label, () => open(panel)];
    const common = panelTip(
      state.solved === 3
        ? 'Three clues solved! Open your Field Guide to save your discoveries and their NASA sources.'
        : 'Ready for a clue? Your Field Guide has three little challenges. Open a clue, then try its question!',
      state.solved === 3 ? 'Save my field notes →' : 'Open my Field Guide →', 'learning-guide');
    const tips = {
      home: [
        ['Hello, explorer! Pick a year to open an archive. Which world will you visit first?', 'Choose a mission →', () => navigate('missions')],
        panelTip('See those little floating objects? Tap one to uncover its story!', 'Explore the objects →', 'objects'),
        ['In the mood for a little space story? Find Watch the story below a mission to see its journey.', 'Find a story →', () => navigate('missions')],
        panelTip('Curious where the clues come from? The Sources card takes you to the original NASA records.', 'Follow the sources →', 'sources'),
      ],
      apollo: [common,
        panelTip('Want a closer look? Turn Eagle around and explore the parts. Then follow the clue in your Field Guide!', 'Explore Eagle →', 'eagle'),
        panelTip('Be a picture detective! Open the photographs and look closely at the real NASA evidence.', 'Open the photographs →', 'photos'),
        panelTip('Try the science screen! Follow the light path and see where the measurement begins.', 'Explore lunar science →', 'science'),
      ],
      viking: [common,
        panelTip('What did Mars feel like? Explore the science screen and compare the recorded weather measurements!', 'Explore Mars weather →', 'viking-weather'),
        panelTip('Be a picture detective! Compare Viking’s real surface photographs with the illustrations around this archive.', 'Open the photographs →', 'viking-photos'),
        panelTip('Take a closer look at Viking! Turn the lander around and explore what its parts do.', 'Explore Viking →', 'viking-lander'),
      ],
      sojourner: [common,
        panelTip('Six little wheels, lots to explore! Turn the rover around and tap a part to find out what it does.', 'Explore the little rover →', 'sojourner-rover'),
        panelTip('Be a picture detective! Open the real NASA photographs and look for clues around the rover.', 'Open the photographs →', 'sojourner-photos'),
        panelTip('What can you hear in the archive? The cassette has short NASA podcast chapters with readable transcripts.', 'Listen to the cassette →', 'sojourner-cassette'),
      ],
    };
    const choices = tips[state.page];
    const [text, label, run] = choices[iteration % choices.length];
    message.textContent = text;
    action.textContent = label;
    runAction = run;
    previousFocus = document.activeElement;
    root.hidden = false;
    help.setAttribute('aria-expanded', 'true');
    tipIndices.set(state.page, iteration + 1);
    if (!manual) counts.set(state.page, (counts.get(state.page) || 0) + 1);
    shownAt = performance.now();
    nextAllowed = shownAt + repeatMs;
    if (manual) action.focus({ preventScroll: true });
  }
  function tick() {
    const state = context();
    const now = performance.now();
    if (state.page !== key) {
      key = state.page;
      nextAllowed = 0;
      reset();
    }
    help.hidden = state.blocked || !cast[state.page];
    if (state.blocked || !cast[state.page]) {
      reset();
      return;
    }
    if (!root.hidden) {
      if (now - shownAt >= visibleMs && !root.contains(document.activeElement)) reset();
      return;
    }
    if (!disabled && (counts.get(key) || 0) < 2 && now - lastActivity >= idleMs && now >= nextAllowed)
      show(state);
  }
  function activity(event) {
    lastActivity = performance.now();
    if (event.type === 'keydown' && event.key === 'Escape') hide();
    if (!root.contains(event.target) && !root.hidden) hide();
  }
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'scroll'])
    document.addEventListener(type, activity, { passive: true });
  root.querySelector('.guide-close').addEventListener('click', reset);
  help.addEventListener('click', () => {
    const state = context();
    if (!state.blocked && cast[state.page]) show(state, true);
  });
  root.querySelector('.guide-disable').addEventListener('click', () => {
    disabled = true;
    reset();
  });
  action.addEventListener('click', () => {
    reset();
    runAction?.();
  });
  tick();
  const timer = setInterval(tick, 1000);
  return {
    reset,
    destroy() {
      clearInterval(timer);
      for (const type of ['pointerdown', 'pointermove', 'keydown', 'scroll'])
        document.removeEventListener(type, activity);
      hide();
      root.remove();
      help.remove();
    },
  };
}
