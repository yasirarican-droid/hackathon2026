export function createExplorerGuide({ asset, context, open, navigate }) {
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
  const shade = document.createElement('div');
  shade.className = 'guide-shade';
  shade.hidden = true;
  shade.setAttribute('aria-hidden', 'true');
  document.querySelector('#application').append(shade);
  const help = document.createElement('button');
  help.className = 'guide-help';
  const portrait = document.createElement('img');
  portrait.alt = '';
  help.append(portrait);
  help.title = 'Ask your explorer guide';
  help.setAttribute('aria-label', 'Ask your explorer guide for another tip');
  help.setAttribute('aria-controls', root.id);
  help.setAttribute('aria-expanded', 'false');
  document.querySelector('#application').append(help);
  const invitation = document.createElement('button');
  invitation.className = 'guide-invitation';
  invitation.hidden = true;
  invitation.textContent = 'Need a clue? Tap me!';
  invitation.setAttribute('aria-label', 'Open your explorer guide');
  document.querySelector('#application').append(invitation);
  const fact = document.createElement('button');
  fact.className = 'guide-help guide-fact';
  fact.hidden = true;
  fact.innerHTML = '<img alt=""><span class="guide-fact-status" aria-hidden="true">!</span>';
  fact.querySelector('img').src = asset('assets/art/guide-astronaut.webp');
  fact.setAttribute('aria-haspopup', 'dialog');
  const factInvitation = document.createElement('button');
  factInvitation.className = 'guide-invitation guide-fact-invitation';
  factInvitation.textContent = 'Did you know? A child helped name this rover!';
  factInvitation.hidden = true;
  document.querySelector('#application').append(fact, factInvitation);
  const image = root.querySelector('img');
  const message = root.querySelector('.guide-message');
  const action = root.querySelector('.guide-action');
  const tipIndices = new Map();
  let key;
  let disabled = false;
  let previousFocus;
  let runAction;
  let inviteAt = performance.now() + 10000;
  let inviteShownAt = 0;
  const inviteCounts = new Map();
  let factAt = performance.now() + 25000;
  let factShownAt = 0;
  let factExposures = 0;
  function updateControl(state) {
    fact.hidden = state.blocked || state.page !== 'sojourner';
    fact.classList.toggle('is-read', Boolean(state.namingSeen));
    fact.dataset.read = String(Boolean(state.namingSeen));
    fact.title = state.namingSeen ? 'The story behind Sojourner’s name' : 'Did you know? Discover Sojourner’s name';
    fact.setAttribute('aria-label', state.namingSeen ? 'Read the story of Sojourner’s name again' : 'Did you know? A child helped name Sojourner');
    fact.querySelector('.guide-fact-status').textContent = state.namingSeen ? '✓' : '!';
    if (fact.hidden || state.namingSeen) factInvitation.hidden = true;
    help.hidden = state.blocked || !cast[state.page];
    if (cast[state.page] && help.dataset.guide !== state.page) {
      const [name, file] = cast[state.page];
      portrait.src = asset('assets/art/' + file);
      help.dataset.guide = state.page;
      help.title = name + ' · Get an explorer tip';
      help.setAttribute('aria-label', name + ': get another explorer tip');
    }
  }
  function hide() {
    const hadFocus = root.contains(document.activeElement);
    root.hidden = true;
    shade.hidden = true;
    help.setAttribute('aria-expanded', 'false');
    if (hadFocus && previousFocus?.isConnected && previousFocus.getClientRects().length)
      previousFocus.focus({ preventScroll: true });
  }
  function reset() {
    hide();
    updateControl(context());
    const now = performance.now();
    invitation.hidden = true;
    factInvitation.hidden = true;
    inviteAt = Math.max(inviteAt, now + 10000);
    factAt = Math.max(factAt, now + 25000);
  }
  function show(state) {
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
    previousFocus = document.activeElement === invitation ? help : document.activeElement;
    root.hidden = false;
    shade.hidden = false;
    invitation.hidden = true;
    factInvitation.hidden = true;
    inviteAt = performance.now() + 75000;
    help.setAttribute('aria-expanded', 'true');
    tipIndices.set(state.page, iteration + 1);
    action.focus({ preventScroll: true });
  }
  function tick() {
    const state = context();
    const now = performance.now();
    if (state.page !== key) {
      key = state.page;
      inviteAt = now + 10000;
      factAt = now + 25000;
      reset();
    }
    updateControl(state);
    if (state.blocked || !cast[state.page]) {
      reset();
      return;
    }
    if (!root.hidden) {
      invitation.hidden = true;
      factInvitation.hidden = true;
      factAt = now + 110000;
      inviteAt = now + 75000;
      return;
    }
    if (!invitation.hidden && now - inviteShownAt >= 5500 && document.activeElement !== invitation)
      invitation.hidden = true;
    if (!disabled && invitation.hidden && factInvitation.hidden && now >= inviteAt && (inviteCounts.get(key) || 0) < 3) {
      invitation.hidden = false;
      inviteShownAt = now;
      inviteAt = now + 75000;
      inviteCounts.set(key, (inviteCounts.get(key) || 0) + 1);
    }
    if (!factInvitation.hidden && now - factShownAt >= 6500 && document.activeElement !== factInvitation)
      factInvitation.hidden = true;
    if (!disabled && !state.namingSeen && state.page === 'sojourner' && invitation.hidden && factInvitation.hidden && now >= factAt && factExposures < 3) {
      factInvitation.hidden = false;
      factShownAt = now;
      factAt = now + 110000;
      factExposures++;
    }
  }
  function activity(event) {
    if (event.type === 'keydown' && event.key === 'Escape') reset();
  }
  for (const type of ['keydown'])
    document.addEventListener(type, activity, { passive: true });
  root.querySelector('.guide-close').addEventListener('click', reset);
  function requestTip() {
    const state = context();
    if (!state.blocked && cast[state.page]) show(state);
  }
  help.addEventListener('click', requestTip);
  invitation.addEventListener('click', requestTip);
  function requestFact() {
    const state = context();
    if (!state.blocked && state.page === 'sojourner') {
      fact.focus({ preventScroll: true });
      reset();
      open('sojourner-name');
    }
  }
  fact.addEventListener('click', requestFact);
  factInvitation.addEventListener('click', requestFact);
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
      for (const type of ['keydown'])
        document.removeEventListener(type, activity);
      hide();
      root.remove();
      help.remove();
      shade.remove();
      invitation.remove();
      fact.remove();
      factInvitation.remove();
    },
  };
}
