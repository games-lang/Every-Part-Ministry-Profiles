// All names and purposes are local suggestions, not claims about readiness or
// placement. Focus text is compared locally and is never sent to the AI.
const themes = [
  {
    signal: /hospitality|greeting|relational connection/i,
    focus: /welcom|newcom|guest|greet|hospitality|connect/i,
    name: "Hospitality Team",
    purpose: "Welcome guests, help newcomers find their way, and make introductions that build relationships.",
  },
  {
    signal: /children|preschool|families/i,
    focus: /child|kid|preschool|famil|parent/i,
    name: "Children & Families Team",
    purpose: "Explore practical support for children and families through age-appropriate activities and parent connection.",
  },
  {
    signal: /youth/i,
    focus: /youth|teen|student/i,
    name: "Youth Mentoring Team",
    purpose: "Support youth gatherings, build consistent mentoring relationships, and plan activities with ministry leaders.",
  },
  {
    signal: /young adults/i,
    focus: /young adult|college|university/i,
    name: "Young Adult Community Team",
    purpose: "Create opportunities for young adults to build friendships, discuss faith, and serve together.",
  },
  {
    signal: /prayer|intercession|faith$|encouragement|exhortation/i,
    focus: /pray|intercess|encourag/i,
    name: "Prayer & Encouragement Team",
    purpose: "Coordinate prayer requests, offer encouragement, and follow up with people who welcome ongoing prayer.",
  },
  {
    signal: /caring for people|care ministry|compassion|mercy|listening|grief|elderly|recovery/i,
    focus: /care|pastoral|listen|grief|elder|recover|support/i,
    name: "Pastoral Care Team",
    purpose: "Explore visits, listening conversations, practical care, and consistent follow-up with people facing difficult seasons.",
  },
  {
    signal: /making ideas clear|teaching|knowledge|discipleship|small groups|new christians|mentoring/i,
    focus: /teach|learn|bible|scripture|discipl|small group|mentor/i,
    name: "Faith Learning Team",
    purpose: "Prepare clear learning sessions, support small-group conversations, and help people take their next learning step.",
  },
  {
    signal: /connecting people with faith|evangelism|outreach|missions|don't know jesus|poverty|justice|advocacy/i,
    focus: /outreach|mission|community|evangel|poverty|justice|neighbo/i,
    name: "Community Outreach Team",
    purpose: "Listen to local needs, build community relationships, and plan practical outreach with the church.",
  },
  {
    signal: /immigrants|refugees|multicultural|translation|second-generation/i,
    focus: /immigrant|refugee|multicultural|translat|language|second.generation/i,
    name: "Cross-Cultural Connection Team",
    purpose: "Support language access, cross-cultural relationships, and welcoming connections across generations.",
  },
  {
    signal: /worship|music|creative expression/i,
    focus: /worship|music|creative|art/i,
    name: "Worship & Creative Arts Team",
    purpose: "Explore music, visual expression, and practical preparation that support church gatherings.",
  },
  {
    signal: /sound\/tech|communications|communication and storytelling/i,
    focus: /sound|tech|communicat|media|story/i,
    name: "Media & Communications Team",
    purpose: "Support clear announcements, shared stories, and reliable sound or media for church activities.",
  },
  {
    signal: /starting and building|leadership|strategic thinking/i,
    focus: /start|launch|lead|plan|strateg/i,
    name: "Ministry Launch Team",
    purpose: "Turn a ministry idea into a small pilot, clarify responsibilities, and review next steps with leaders.",
  },
  {
    signal: /noticing what needs attention|problem.solving|discernment|wisdom/i,
    focus: /improv|problem|review|discern|decision/i,
    name: "Ministry Improvement Team",
    purpose: "Listen for obstacles, compare practical improvements, and help leaders test thoughtful next steps.",
  },
  {
    signal: /organizing|administration|office\/admin|event planning|finance|giving|follow.through/i,
    focus: /admin|organiz|event|finance|giv|budget|detail/i,
    name: "Ministry Support Team",
    purpose: "Coordinate event details, resources, and follow-through so people know what is needed and who is responsible.",
  },
  {
    signal: /practical hands|maintenance|craftsmanship|helps|service|transportation|adaptability/i,
    focus: /practical|repair|maint|setup|transport|hands.on|help/i,
    name: "Practical Support Team",
    purpose: "Plan setup, repairs, transport, or other hands-on tasks around the church's identified practical needs.",
  },
  {
    signal: /celibacy/i,
    focus: /single|unmarried|dedicat/i,
    name: "Dedicated Service Team",
    purpose: "Discuss sustainable ways to serve that fit participants' commitments, capacity, and current season.",
  },
];

export function signalTeamTemplate(label: string) {
  return themes.find((theme) => theme.signal.test(label)) ?? {
    name: `${label.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())} Team`,
    purpose: `Plan a small serving project around ${label.toLowerCase()}, identify who it could help, and review next steps with a ministry leader.`,
  };
}

export function focusSignalScore(label: string, focus: string): number {
  const genericTerms = new Set(["the", "and", "for", "with", "our", "people", "serving", "team", "ministry"]);
  const terms = new Set(focus.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !genericTerms.has(term)));
  const literalMatches = label.toLowerCase().split(/[^a-z0-9]+/).filter((term) => terms.has(term)).length;
  const relatedThemes = themes.filter((theme) =>
    theme.signal.test(label) && new RegExp(`\\b(?:${theme.focus.source})`, "i").test(focus)
  ).length;
  return literalMatches + relatedThemes * 2;
}
