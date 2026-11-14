export function renderLearningGuide({
  host,
  mission,
  data,
  solved,
  solve,
  open,
  sources,
  node,
  action,
  reset,
  saved,
}) {
  const spec = data[mission];
  host.append(node("p", "panel-tag", "YOUR FIELD GUIDE"));
  const heading = node("h2", "", spec.title);
  heading.id = "exhibit-title";
  host.append(heading, node("p", "panel-intro", spec.question));
  const total = spec.goals.filter((goal) =>
    solved.has(mission + ":" + goal.id),
  ).length;
  const status = node(
    "p",
    "learning-progress",
    `${total} / ${spec.goals.length} learning goals completed · ${saved ? "Saved on this device" : "Progress available for this visit"}`,
  );
  status.setAttribute("role", "status");
  const meter = document.createElement("progress");
  meter.max = spec.goals.length;
  meter.value = total;
  meter.setAttribute("aria-label", "Learning goals completed");
  host.append(status, meter);
  if (total === spec.goals.length) {
    const summary = node("section", "learning-summary");
    summary.append(node("h3", "", "Here is what you can explain now"));
    const list = node("ul");
    for (const goal of spec.goals) list.append(node("li", "", goal.takeaway));
    summary.append(
      list,
      action("Save my field notes", () => {
        const text = [
          spec.title,
          spec.question,
          "",
          ...spec.goals.flatMap((goal) => [
            goal.takeaway,
            ...goal.sources.map((id) => data.sourceURLs[id]),
            "",
          ]),
          "Practice completed in NASA Starboard. This is not a test certificate or proof of learning effectiveness.",
        ].join("\n");
        const url = URL.createObjectURL(
          new Blob([text], { type: "text/plain;charset=utf-8" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `starboard-${mission}-field-notes.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
    );
    host.append(summary);
  }
  for (const [index, goal] of spec.goals.entries()) {
    const card = node("section", "learning-card");
    const complete = solved.has(mission + ":" + goal.id);
    card.dataset.goal = goal.id;
    const title = node(
      "h3",
      "",
      `${index + 1}. ${goal.title}${complete ? " · Complete" : ""}`,
    );
    card.append(
      title,
      node("p", "", goal.objective),
      action("Find the evidence →", () => open(goal.evidence)),
    );
    const question = node("fieldset", "learning-choices");
    question.append(node("legend", "", goal.prompt));
    const feedback = node(
      "p",
      "learning-feedback",
      complete
        ? goal.explanation
        : "Choose an answer after following the clue.",
    );
    feedback.setAttribute("aria-live", "polite");
    for (const [i, label] of goal.choices.entries()) {
      const choice = action(label, () => {
        if (i !== goal.answer) {
          feedback.textContent = "Follow the clue and try again. " + goal.hint;
          choice.setAttribute("aria-pressed", "false");
          return;
        }
        solve(mission + ":" + goal.id);
        renderLearningGuideFresh(index);
      });
      choice.disabled = complete;
      if (complete && i === goal.answer) choice.classList.add("correct");
      question.append(choice);
    }
    card.append(question, feedback, sources(goal.sources));
    host.append(card);
  }
  host.append(action("Reset saved progress", reset));
  function renderLearningGuideFresh(index) {
    host.replaceChildren();
    renderLearningGuide({
      host,
      mission,
      data,
      solved,
      solve,
      open,
      sources,
      node,
      action,
      reset,
      saved,
    });
    const target =
      host.querySelector(".learning-summary h3") ||
      host.querySelectorAll(".learning-card h3")[index];
    target.tabIndex = -1;
    target.focus();
  }
}

export function mountPartLesson({ host, spec, viewer, node, action, sources }) {
  const panel = node("section", "part-lesson");
  panel.append(
    node("h3", "", "Explore the parts"),
    node("p", "", spec.instruction),
  );
  const readout = node("div", "part-readout");
  readout.setAttribute("aria-live", "polite");
  const choices = node("div", "part-buttons");
  const choose = (id, focus = true) => {
    const part = spec.parts.find((p) => p.id === id);
    if (!part) return;
    readout.replaceChildren(
      node("h4", "", part.title),
      node("p", "", part.text),
      sources(part.sources),
    );
    for (const button of choices.children)
      button.setAttribute("aria-pressed", String(button.dataset.part === id));
    if (focus) viewer.focusPart?.(id);
  };
  for (const part of spec.parts) {
    const button = action(part.title, () => choose(part.id));
    button.dataset.part = part.id;
    button.setAttribute("aria-pressed", "false");
    choices.append(button);
  }
  panel.append(choices, readout);
  host.append(panel);
  viewer.onPartSelect?.(choose);
  choose(spec.parts[0].id, false);
  return choose;
}
