/* REPORT GENERATOR ONLY. Reads workspace sources; writes only final review artifacts. */
const fs = require("node:fs");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const baselinePath = "reports/revised-integrated-question-bank.json";
const htmlBaselinePath = "reports/revised-integrated-content-design.html";
const baselineText = fs.readFileSync(baselinePath, "utf8");
const baseline = JSON.parse(baselineText);
const hash = text => crypto.createHash("sha256").update(text).digest("hex");
const originalHashes = [baselinePath, htmlBaselinePath].map(path => ({path, sha256: hash(fs.readFileSync(path))}));
const bank = structuredClone(baseline);
const qid = id => `EP-I-${id}`;
const byId = Object.fromEntries(bank.coreQuestions.map(q => [q.id,q]));
const original = Object.fromEntries(baseline.coreQuestions.map(q => [q.id,q]));
// Each row: focused wording (null = unchanged), alternative explanation, culture/translation,
// distinctive evidence vs nearby items. These are editorial judgments, not participant findings.
const reviews = {
  "01": ["I guide people in choosing how to begin serving a community where no such effort is established.", "Entrepreneurship or an assigned project can explain starting; it is not proof of apostolic calling.", "A new effort can be started with others, without a title, money, or public authority.", "Guides the initial choice of an absent response; 44 gathers people, 05 guides first shared action, and 02 develops its workable process."],
  "02": ["I turn an idea for a new way of serving a community into steps that people can use to establish it.", "Project-management training can produce this behavior without apostolic ministry.", "Accept oral or shared planning; establishing does not require an institution.", "Establishing a usable process differs from 04 coordinating an existing plan and 46 sequencing resources."],
  "03": ["I adjust how I build relationships when people in a community follow customs different from mine.", "Social sensitivity or migration experience may explain it without cross-cultural ministry.", "No travel or majority-culture assumption; customs includes local differences.", "Relationship-building adaptation, rather than 18 learning before help or 19 helping newcomers participate."],
  "04": [null, "A paid administrative role may produce high answers; opportunity is not gifting.", "People, information, or supplies includes informal shared work; no literacy requirement.", "Coordinates an existing plan, unlike pioneering 02 or longer-range stages in 46."],
  "05": ["I guide a group toward its first shared action when it is beginning a new effort to serve people.", "An assigned convenor may do this; initiative alone is not Apostle or spiritual Leadership.", "Guidance may be quiet and shared; no solo founder or public-speaking requirement.", "Directs the first collective action; 01 starts a response and 44 assembles participants."],
  "06": ["When a group faces a problem with several possible solutions, I compare how each would affect its longer-term goal.", "Analytical training may explain comparison; a high answer need not imply actual success.", "Explain longer-term as later consequences; allow spoken comparison, not formal strategy documents.", "Compares future consequences before a choice; 45 addresses a stalled new effort and 60A tests a practical repair."],
  "07": ["I notice when a group's actions conflict with the Christian commitments it says it follows.", "Rule vigilance or disagreement with a group can be mistaken for prophetic insight.", "Commitments must be locally understood; do not equate majority custom with Christian truth.", "Notices inconsistency, before the response behaviors in 12 and 14."],
  "08": ["When a group's use of Christian teaching could harm someone, I raise the concern in a way the group can consider.", "Assertiveness, personal conflict, or safeguarding training can explain concern-raising.", "Private, mediated, or collective raising counts; never require unsafe confrontation of authority.", "A specific potentially harmful use of teaching, rather than 13 repeated unfair burdens."],
  "09": ["Before offering guidance from my faith, I listen to the person's situation so the guidance fits the details they share.", "Counselling skill or learned politeness may explain listening without spiritual Wisdom.", "Guidance can be informal and oral; do not require an educated adviser or disclosure of trauma.", "Contextual listening before advice; 33 applies truth to a concrete choice and 14 checks a group decision."],
  "10": ["I identify who is being left out of a group's activity so their exclusion can be addressed.", "An assigned inclusion role may explain noticing; advocacy is not proven by awareness alone.", "Quiet participation may be chosen, not exclusion; ask rather than assume.", "Identifies the people affected, unlike 08 raising a teaching concern or 13 identifying a recurring pattern."],
  "11": ["I recognize an early sign that a teaching about faith could lead people toward a harmful choice.", "Anxiety or doctrinal disagreement may look like foresight; examples need discussion.", "No claim of spiritual-source detection; translate early sign concretely.", "Prospective consequence recognition, unlike 07 comparing current actions with stated commitments."],
  "12": ["When a group's Christian commitments to care for people are overlooked, I ask the group to address the neglected need.", "A care role or personal interest can motivate the request without a Prophet orientation.", "A request may go through a trusted intermediary; authority challenge is not the measured skill.", "Moves a neglected stated commitment toward response; 10 notices exclusion and 13 names recurring unfairness."],
  "13": ["I point out a repeated practice that unfairly burdens people and conflicts with our Christian commitment to care for them.", "Justice campaigning or personal hurt may explain it without a distinct prophetic ministry.", "Repeated practice is plainer than pattern; indirect and collective communication counts.", "Systemic repetition differs from a single neglected need in 12."],
  "14": ["Before a group decides, I examine how its choice fits the biblical teaching it is trying to follow.", "Theological knowledge or conformity can masquerade as sound application.", "No formal Bible training required; oral teaching counts; interpretation can be contested.", "Pre-decision application, distinct from noticing existing inconsistency in 07 and individual counsel in 33."],
  "15": [null, "General friendliness may explain relationships; ongoing faith exploration must be part of the example.", "Faith relationships need not involve public evangelism, persuasion, or safety risks.", "Accompanies relationships with interested people; 16 explains and 49 shares a personal account."],
  "16": [null, "Communication training may explain clarity without an Evangelist orientation.", "Questions can be addressed privately and in a person's own language; not public speaking.", "Connects Christian faith to another's question, not simply recounting an experience in 49."],
  "17": ["When someone is exploring Christian faith, I listen to the questions they hesitate to ask so we can explore them together.", "General listening or nonjudgmental friendship could account for the behavior.", "Hesitation may reflect danger or respect, not lack of interest; never press for disclosure.", "Creates space for hesitant exploration; 47 answers an actual question about one's beliefs."],
  "18": ["I adapt the help I offer in a different culture or community after learning how local people understand the need.", "Good aid practice or professional training can explain adaptation without missionary gifting.", "Local people lead; no travel, colonial helper, or financial-privilege requirement.", "Changes a proposed form of help; 03 adapts relationships and 19 adapts participation guidance."],
  "19": ["I adapt how I explain a group's activities so a newcomer with different language or customs can take part.", "Translation ability or a reception assignment can explain it without cross-cultural ministry.", "Use a shared language, gesture, or interpreter; no assumption that newcomers must assimilate.", "Participation across a real cultural barrier, unlike general welcome in 55 and conversational inclusion in 56."],
  "20": [null, "Affirmation may be learned social courtesy rather than a recurring encouraging contribution.", "Honest encouragement can be indirect; avoid assuming praise in public is welcome.", "Names observed progress, unlike hope during discouragement in 26 or recovery from setback in 51."],
  "21": ["After someone shares a difficult time in their faith, I carry out the follow-up care I agreed to offer.", "A formal care duty may explain follow-up without pastoral gifting or unusual compassion.", "Private contact and agreed boundaries matter; no entitlement to another's story.", "Completes promised follow-up after distress; 50 reconnects after withdrawal."],
  "22": ["I help someone I support in their faith choose a next step suited to their present stage of growth.", "Coaching or parenting experience may explain developmental guidance.", "Growth is not status or education; the person chooses, and support need not be formal ministry.", "Stage-sensitive guidance; 52 sustains support while a person learns a role."],
  "23": ["I remain available for spiritual support to a person whose distress continues over time.", "Family obligation, attachment, or a paid care role may explain availability.", "No demand for unlimited availability or unsafe relationships; distress is plainer than complicated season.", "Sustained presence through distress; 21 completes a specific commitment and 24 offers practical help."],
  "24": ["I provide practical help that a person in distress says would support them.", "Task competence or duty may explain helping without a recurring mercy pattern.", "Let the recipient name useful support; resources include time, not wealth; consent matters.", "Recipient-led practical relief, unlike ongoing spiritual care in 23 or routine group service in 57."],
  "25": ["I continue praying for another person's need because I trust God's care, even when no change is visible.", "Prayer discipline, habit, or anxiety may explain persistence rather than unusual Faith.", "No promised outcome or blame for unanswered prayer; quiet and communal prayer count.", "Persistent trust while an answer is not visible; 54 maintains entrusted requests and 27 links trust with action."],
  "26": [null, "Optimism or conventional comforting words can produce high endorsement.", "Hopeful words may be spoken, written, signed, or prayed; no forced positivity.", "Encouragement during discouragement, not praise for progress in 20."],
  "27": ["When people face an uncertain outcome, I pray for them and take the next available action while trusting God's care.", "Duty and practical coping may explain this without unusual faith; prayer is not outcome control.", "An available action can be small; do not imply that disability or lack of options is weak faith.", "Prayer expressed in a next action under uncertainty, not the long persistence in 25 or entrusted practice in 54."],
  "28": ["I explain a teaching from Scripture in simple language after learning what it means.", "Religious education and verbal fluency can explain this without a teaching ministry.", "Learning may be oral; Scripture access varies; no academic credential needed.", "Basic accurate explanation, unlike 29 careful study, 30 illustration, 31 diagnosis, and 53 checking understanding."],
  "29": ["I study a faith topic carefully and explain what I learned in an order another person can follow.", "Schooling or prepared materials can account for organized explanation.", "Study includes listening and discussion, not only books or formal education.", "Depth and ordered understanding; 28 plain explanation alone does not require careful topic study."],
  "30": [null, "Storytelling skill may be high even when theological understanding is limited.", "Use culturally familiar examples; visual and oral forms count without literacy.", "Illustrates understanding; 53 checks whether the explanation was understood."],
  "31": [null, "Tutoring technique or courtesy may explain asking questions.", "A learner may not openly admit confusion; invite private or indirect feedback.", "Diagnoses confusion before further explanation; 53 checks understanding afterward."],
  "32": ["I communicate what I have learned from Scripture so another person can examine the meaning with me.", "Verbal confidence can look like knowledge; accuracy still requires community review.", "Shared examination may be oral; insight is not a claim of revelation.", "Exploratory communication of understanding, not the full teaching sequence in 28–31."],
  "33": ["I apply a teaching from my faith to a practical choice in a way that takes account of the facts and people affected.", "Good judgment or professional expertise may account for the advice.", "Allow multiple faithful applications; faith language must be understandable locally.", "Applies truth to a concrete choice; 09 listens before counsel and 14 examines a group's proposed choice."],
  "34": ["I adapt a design to make a useful object suited to a group's activity.", "A work assignment or craft hobby may explain the skill without spiritual gifting.", "Local craft, reused materials, and simple tools count; not expensive equipment.", "Design adaptation and construction for group use; 36 repairs and 58A develops musical craft."],
  "35": ["I use musical expression to help a group participate in worship.", "Musical training or an assigned role may explain participation without a distinct gift.", "Voice, rhythm, and local musical forms count; no instrument purchase or stage required.", "Facilitates participation during worship; 58A rehearses and 59A adapts music beforehand."],
  "36": ["I repair an item that a group needs so it can be used again in the group's work.", "Trade training or a paid repair task can explain this without a service gift.", "Simple repairs count; physical access and disability affect opportunity.", "Restores an existing object, unlike making a new design in 34; this replaces vague artistic-or-technical preparation."],
  "37": ["As an unmarried person, I freely choose to remain unmarried in this season so I can devote myself to serving God.", "Personal preference or limited marriage opportunity can look like a particular grace.", "Never infer calling from marital status; no pressure to remain unmarried; seasons can change.", "Voluntary intention, distinct from sustained contentment in 38 or handling pressure in 39."],
  "38": ["As an unmarried person, I have found sustained contentment in an unmarried life devoted to serving God.", "Current satisfaction does not prove celibacy as a gift or a lifelong vocation.", "Widowhood, divorce, coercion, and social stigma require sensitive opt-out; contentment is not compulsory.", "Lived sustainability rather than the declared choice in 37; former counsel-seeking was context, not gift evidence."],
  "39": ["As an unmarried person, I keep my freely chosen commitment to unmarried service even when others expect me to marry.", "Resistance to family pressure may explain this without a celibacy gift.", "Safety first; no expectation of defying family publicly; N/A if no such experience.", "Persistence under external expectations, not simple free time or relationship status."],
  "40": ["I voluntarily reduce my personal spending so I can share the resources saved with others.", "Frugality or economic pressure can resemble voluntary poverty; choice must be real.", "Never score imposed deprivation, amount given, or income; responsibilities still come first.", "A completed reduction tied to sharing; 41 chooses simplicity prospectively and 42 sustains a simpler life."],
  "41": ["When I could choose more for myself, I choose a simpler option so I can give the difference to meet a need.", "A one-off bargain or social pressure may explain giving the difference.", "Only freely available choices count; necessary care and family responsibilities are not excess.", "Choice at a decision point; 40 actual reduction and 42 sustained lifestyle are related but not interchangeable."],
  "42": ["I sustain a voluntarily simpler way of living because it frees me to serve others.", "Low income or minimalist preference can resemble this without a spiritual vocation.", "No scoring of involuntary poverty; simpler is relative to one's responsibilities and means.", "Sustained lifestyle rather than an individual resource decision in 40 or 41."],
  "43": [null, "Disposable income, free time, or social obligation may explain sharing.", "Small and nonfinancial resources count; no amount-based comparison; receiving help is not failure.", "Responsive sharing when a need appears, distinct from planned consistency in 62A or simplifying one's life."],
  "44": ["I bring people together to begin a new ministry response where no group is yet addressing the need.", "Community organizing or job responsibilities can explain recruitment.", "Ministry includes informal care and service; no official appointment or lone founder assumption.", "Forms a group for a new response, unlike 01 initiating the response or 05 guiding first action."],
  "45": ["When a new effort to serve people stalls, I work out a way past the obstacle that still supports its longer-term purpose.", "Project expertise may explain obstacle removal without apostolic ministry.", "Stalls means cannot continue; no business language or expectation of financial power.", "Preserves a pioneering purpose through difficulty; 60A solves an ordinary practical failure."],
  "46": ["For a new effort to serve people, I organize its stages and limited resources around what must happen first to reach its longer-term purpose.", "Planning credentials may explain sequencing; writing a plan is not completion.", "An oral shared plan counts; resources include people and time, not only money.", "Purpose-led sequencing and resource constraints; 02 establishes usable steps and 04 coordinates an existing plan."],
  "47": ["When someone asks about Christian faith, I listen to what they want to understand before sharing my response.", "Courtesy or reflective listening may explain the behavior.", "No pressure to disclose faith in unsafe settings; one-to-one and mediated discussion count.", "Responds to an actual question; 17 makes room for hesitant questions and 16 emphasizes explanation."],
  "48": ["I help a person exploring Christian faith plan steps for their own learning that fit the questions they want to explore.", "Education or coaching skills can explain a plan without evangelistic orientation.", "The interested person chooses; no conversion quota, literacy, or formal course assumed.", "Scaffolds the person's learning, not a single invitation; differs from ongoing established-faith growth in 22."],
  "49": [null, "A strong autobiographical story may be engaging without evangelistic purpose.", "A short account can be private or oral; do not privilege dramatic conversion stories.", "Personal testimony rather than general explanation in 16 or listening in 47."],
  "50": ["When a person I support spiritually withdraws, I carry out an agreed check-in to learn what care they need.", "Assigned pastoral duties or worry may explain checking in.", "Consent and privacy come first; withdrawal may be a healthy boundary rather than a problem.", "Reconnection after withdrawal, unlike follow-up after disclosed distress in 21."],
  "51": ["After a setback in someone's faith journey, I encourage them toward a next step suited to their situation.", "Counselling skill or optimism can produce encouragement without shepherding.", "Journey means developing faith; no assumption that setbacks imply moral failure.", "Restores movement after a setback; 20 names progress and 22 supports ordinary growth."],
  "52": ["As someone learns a role serving others, I keep the support commitments I have made for their spiritual growth.", "Line management or conscientiousness may explain keeping commitments.", "Informal roles count; keep commitments within capacity, not unlimited mentoring.", "Sustained developmental support in a role, unlike an initial stage-sensitive next step in 22."],
  "53": ["After explaining a faith idea, I invite the person to describe what they understood so I can clarify my explanation.", "Teacher training may explain checking comprehension.", "Avoid a test or public embarrassment; spoken, signed, indirect, and private responses count.", "Checks after explanation, whereas 31 diagnoses confusion before explaining further."],
  "54": ["I return regularly to pray for specific needs people have asked me to remember.", "Habit, a roster, or conscientiousness can explain the routine.", "No written prayer list or clergy role required; respect confidentiality.", "Entrusted, specific, recurring requests, unlike unanswered-prayer persistence in 25 or action under uncertainty in 27."],
  "55": [null, "Event-planning employment may explain welcome preparation.", "No home ownership or event budget needed; accessibility includes sensory and language needs.", "Prepares navigation and expectations before arrival, unlike 56 inclusion in conversation."],
  "56": [null, "Social confidence or a facilitation role may explain inclusion.", "Do not force quiet people to speak; make an invitation without insisting.", "Connects a person during interaction; 55 prepares a welcoming setting."],
  "57": ["I complete a practical task such as setting up, cleaning, or carrying supplies so others can do their part.", "Paid work, obligation, or compliance may explain service.", "Examples are alternatives for one practical-support behavior; disability-sensitive options and N/A matter.", "Completes routine support work; 34 makes and 36 repairs objects."],
  "58A": ["I practice musical parts so I can contribute them dependably to a group's worship.", "Training access or conscientious rehearsal may explain musical preparation.", "Voice and rhythm count; practice need not use an instrument or formal notation.", "Skill preparation, not original creative expression; 35 leads participation and 59A adapts choices."],
  "59A": ["I adapt music so a particular group can participate in worship.", "Musical arranging training may explain adaptation without spiritual gifting.", "Adaptations may be oral, rhythmic, linguistic, or accessibility-related; no Western repertoire assumed.", "Purposeful adaptation, not mere selection of a song or rehearsal in 58A."],
  "60A": [null, "Technical expertise may explain troubleshooting; this is a capability rather than spiritual maturity.", "Breaks down means stops working; allow home and community problems.", "Tests a workable alternative after failure, unlike 06 comparing longer-term options."],
  "61A": ["When a group faces uncertainty, I encourage its next step by expressing trust in God's care without promising an outcome.", "A leadership role, optimistic temperament, or rehearsed faith language may explain encouragement.", "No guarantees or blame for doubt; trust does not replace appropriate practical help.", "Communal confidence under uncertainty, distinct from personal persistence in 25 and prayer-linked action in 27."],
  "62A": ["I plan what resources I can share regularly while meeting the responsibilities already entrusted to me.", "Budgeting skill or financial security can explain consistency without a giving gift.", "Resources include small amounts and time; commitments and care are not failures of generosity.", "Sustained planned sharing, unlike response to an immediate need in 43."],
};
const removedMapReasons = {
  "08|Strength|Communication and storytelling": "Raising a concern is not enough evidence of narrative or explanatory capability; removes generic speaking-to-communication inflation.",
  "10|Strength|Compassion and care": "Noticing exclusion is not providing care; retain advocacy signal without counting awareness as compassion.",
  "32|Strength|Teaching and explaining": "Shared examination of an insight does not necessarily demonstrate explanation; other teaching indicators remain.",
  "35|Spiritual Gift|Craftsmanship": "Music participation alone does not separately evidence developed craft; retain rehearsed craft in 58A, making in 34, and repair in 36.",
  "36|Strength|Creative expression": "Repairing a needed item need not involve artistic expression; replacement focuses practical restoration.",
  "58A|Strength|Creative expression": "Rehearsing a part measures preparation and skill, not necessarily original or expressive adaptation.",
};
const specificRationales = {
  "01": ["Guiding the choice of a previously absent service response supports a pioneering orientation, not mere task initiative.", "Helping people determine how to establish a new community-serving work supports starting new work; calling remains unverified.", "Guiding people's choice of a shared response is an explicit but limited direction signal, not sustained leadership proof.", "Guiding the first choice of a new response demonstrates leadership and initiative capability."],
  "02": ["Establishing a new service response is the pioneering object of the planning.", "Turning an absent service idea into an established process directly supports starting new work.", "Usable steps support administration secondarily; coordinating an ongoing system is not the main behavior.", "Ordering actionable steps directly demonstrates organizing capability."],
  "19": ["Participation across different language or customs is actual cross-cultural service, not merely meeting a newcomer.", "Enabling a newcomer to participate supports welcome secondarily; cultural adaptation is the central behavior.", "Making entry understandable is a concrete hospitality capability.", "Changing an explanation to fit different customs is a limited but explicit adaptation signal."],
  "21": ["Continuing spiritual care after distress directly supports a shepherding orientation.", "Agreed ongoing care for someone's faith directly fits spiritual nurturing.", "Care following distress is a limited mercy signal, not inferred from administrative follow-up alone.", "Carrying out an agreed follow-up is completion, not merely a plan."],
  "23": ["Remaining available for spiritual support over time directly expresses shepherding.", "Ongoing spiritual care fits pastoring rather than generic friendship alone.", "Availability through distress genuinely supports mercy; the item centers spiritual support, so this stays secondary.", "Sustained presence for a distressed person is an observable care capability."],
  "28": ["Explaining Scripture is a teacher-oriented ministry behavior.", "Plain explanation of biblical teaching directly fits the Teaching gift.", "Learning the meaning supplies a limited knowledge signal; explanation, not depth of study, is central.", "Making learned meaning understandable is direct explanatory capability."],
  "29": ["Study directed toward another person's understanding supports Teacher orientation.", "Careful topic study and communicating its meaning directly match Knowledge.", "An explanation after study supports Teaching secondarily; the focus is learned understanding.", "An order another person can follow is observable explanatory capability, not mere note-taking."],
  "30": ["Helping another understand Scripture through an illustration supports Teacher.", "Applying an illustration to biblical understanding directly supports Teaching.", "An example chosen to clarify meaning is direct explanatory capability.", "A story or picture is a limited communication signal; the item does not require storytelling as its main skill."],
  "31": ["Adapting explanation after diagnosing confusion is teacher-oriented.", "Question-led clarification of Scripture directly supports Teaching.", "Finding the learner's misunderstanding to explain better is explanatory capability.", "Attending to a learner's response is a limited listening signal, not a full listening construct."],
  "34": ["Adapting a design to make a useful object for others directly matches artistic/practical craft.", "Meeting a group's practical need through the object supports service secondarily.", "Making the object requires practical hands-on capability.", "Adapting the design to a particular activity supplies a limited creative signal; copying a supplied design without adaptation would not."],
  "44": ["Gathering a group for a previously unaddressed ministry need supports pioneering.", "Forming a new ministry response directly fits beginning and establishing work.", "Mobilizing people is a limited leadership signal; directing them over time is not claimed.", "Actually assembling participants around a response is initiative capability."],
  "45": ["Helping an emerging service effort continue through an obstacle supports establishment, a narrower Apostle indicator.", "Enabling new work to take root despite obstacles supports Apostleship; not every problem-solver has that gift.", "Working out a way past an obstacle is direct problem-solving capability.", "Keeping the solution aligned with a longer-term purpose is explicit but secondary strategic evidence."],
  "46": ["Establishing stages for a new service effort supports a pioneering orientation, though opportunity matters.", "Coordinating stages and scarce resources directly matches Administration.", "Arranging stages and resources is observable organizing capability.", "Choosing what must precede what for a longer-term purpose supports strategy secondarily, not proven strategic success."],
  "50": ["Reconnecting in an ongoing spiritual-support relationship directly expresses shepherding.", "Agreed spiritual check-in for needed care fits pastoral nurturing.", "Carrying out, not simply scheduling, the check-in is direct follow-through.", "Learning care needs after withdrawal supports compassion secondarily; presence alone does not prove unusual mercy."],
  "51": ["Supporting recovery after a faith setback is a shepherding orientation.", "A next step suited to the person's faith situation is spiritual nurturing.", "Encouraging renewed movement is a limited Exhortation signal; the context centers ongoing care.", "Offering situation-specific encouragement after a setback is encouraging capability."],
  "52": ["Continuing support for spiritual development in a service role fits shepherding.", "Supporting spiritual growth over time directly fits Pastoring.", "Keeping developmental support in place as someone learns a role is mentoring capability.", "Kept support commitments provide a limited follow-through signal; not a general conscientiousness inference."],
};
for (const q of bank.coreQuestions) {
  const short = q.id.slice(5);
  if (q.maps[0][0] === "Personality") continue;
  const [text, alternative, culture, distinctness] = reviews[short];
  if (text) q.text = text;
  q.maps = q.maps.filter(m => !removedMapReasons[`${short}|${m[0]}|${m[1]}`]);
  if (specificRationales[short]) {
    assert.equal(specificRationales[short].length, q.maps.length, q.id);
    q.maps.forEach((m,i) => m[3] = specificRationales[short][i]);
  }
  q.baselineChange = q.change;
  q.change = text ? (short === "36" ? "replaced-in-place" : "rewritten") : "wording-retained";
  q.itemAudit = {alternativeExplanation: alternative, culturalTranslationReview: culture, uniqueValue: distinctness,
    decision: text ? "Narrow or replace wording; retain only directly defensible maps. Editorial review, not field verification." : "Retain wording with the named limitation; no inference of calling, maturity, or outcome certainty."};
}
// Refresh rationales on non-four-map rewrites where the original rationale no longer fits.
const additionalRationales = {
  "03": ["Adapting relationship-building across customs supports cross-cultural ministry, not social confidence alone.", "Building relationships is an observable relational contribution.", "Changing one's approach for different customs is explicit secondary adaptability evidence."],
  "05": ["Guiding the beginning of a new service effort is a limited pioneering context, not generic willingness to start.", "Guiding a group into shared action supplies direction and motivation.", "Leading actual first action demonstrates initiative capability."],
  "06": ["Comparing longer-term effects of solutions directly measures strategic consideration.", "Comparing possible solutions to an actual problem is meaningful secondary problem-solving evidence."],
  "07": ["Recognizing inconsistency with Christian commitments supports a Prophet orientation, not Prophecy Gift.", "Comparing action with a stated standard is evaluative discernment, not Discernment of Spirits."],
  "08": ["Concern about harmful application of Christian teaching supports corrective ministry, not assertiveness alone.", "Raising a concern on behalf of those potentially harmed supports advocacy."],
  "09": ["Fitting faith guidance to actual circumstances supports spiritual Wisdom, not listening alone.", "Listening to situation details is a direct listening behavior.", "Considering relevant details before guidance provides secondary practical discernment, not spiritual-source detection."],
  "10": ["Identifying exclusion so it can be addressed is an advocacy-related capability; it remains a narrow indicator, not demonstrated campaign impact."],
  "11": ["Identifying harmful consequences of faith teaching supports a prospective corrective orientation.", "Recognizing a consequence before action provides evaluative discernment, not supernatural sensing."],
  "12": ["Calling a group back to its Christian care commitments supports a corrective ministry orientation.", "Requesting action on a neglected need supports advocacy, not general criticism."],
  "13": ["Naming repeated harm in conflict with Christian care supports a corrective orientation.", "Pointing out an unfair recurring burden directly supports justice advocacy."],
  "14": ["Examining fidelity to biblical teaching supports the Prophet orientation.", "Applying biblical teaching to a real decision directly supports Wisdom.", "Evaluating a proposed action against a relevant standard is practical discernment."],
  "17": ["Exploring hesitant Christian-faith questions supports an Evangelist orientation, not friendliness alone.", "Accompanying actual faith exploration supports Evangelism.", "Listening to hesitant questions is explicit secondary listening evidence."],
  "18": ["Adjusting help after learning from another community is cross-cultural ministry behavior.", "Changing offered help in response to local understanding directly supports adaptability capability."],
  "22": ["Guiding a person's faith development directly supports Shepherd.", "Faith-specific guidance is spiritual nurturing rather than generic coaching alone.", "A next step fitted to developmental stage directly supports mentoring."],
  "24": ["Responding to a distressed person's stated need directly supports Mercy.", "Providing actual practical help supplies meaningful secondary service evidence.", "Recipient-led support demonstrates care rather than just kind intentions."],
  "25": ["Persisting in prayer for another need directly supports Intercession.", "Trust in God's care despite no visible change is explicit but secondary Faith evidence, not prayer frequency alone."],
  "27": ["Prayer-linked action in trust of God's care during uncertainty supports Faith without guaranteeing an outcome.", "Praying for other people in uncertainty supplies secondary Intercession evidence, not self-focused prayer alone."],
  "32": ["Helping another examine learned Scripture meaning supports Teacher secondarily, not a full teaching behavior.", "Communicating learned Scripture meaning directly matches Knowledge.", "Communicating meaning for shared examination supports communication capability, not speaking volume."],
  "33": ["Contextual application of faith teaching directly matches spiritual Wisdom.", "Weighing facts and effects on people supports practical judgment, not Discernment of Spirits."],
  "35": ["Using musical expression for shared worship directly supports Music / Worship.", "Expressive musical contribution supports creative expression; simple attendance does not."],
  "36": ["Repairing a useful object is practical craftsmanship for a shared purpose.", "Restoring a needed item for others is explicit secondary service.", "Actual repair provides secondary hands-on capability within the main shared-craft behavior; weight is not promoted to fill coverage."],
  "37": ["A freely chosen unmarried devotion is directly relevant to Celibacy's source definition, but choice alone cannot establish a particular grace."],
  "38": ["Sustained contentment in unmarried devotion provides experiential evidence distinct from choosing it; not generic counsel-seeking."],
  "39": ["Sustaining a freely chosen unmarried service commitment under expectations to marry provides a third contextual indicator; not mere availability."],
  "40": ["A voluntary reduction for others supports chosen simplicity, not imposed poverty.", "Sharing the actual savings is explicit secondary Giving evidence."],
  "41": ["Choosing less when more is genuinely available supports voluntary simplicity.", "Giving the difference to meet a need is explicit secondary Giving evidence."],
  "42": ["Sustained voluntary simplicity for service directly supports Voluntary Poverty, without scoring income or deprivation."],
  "47": ["Listening before responding to Christian-faith inquiry supports an Evangelist orientation.", "Accompanying actual gospel inquiry supports Evangelism.", "Listening to what the person wants to understand is direct listening capability."],
  "48": ["Accompanying another's Christian-faith exploration supports Evangelist.", "Helping an interested person take self-chosen learning steps supports Evangelism.", "Scaffolding a learning sequence around the learner's questions supports mentoring, unlike the former single invitation."],
  "53": ["Checking understanding after faith explanation is Teacher-oriented.", "Clarifying biblical/faith understanding supports Teaching.", "Using learner feedback to clarify is direct teaching capability."],
  "54": ["Regularly returning to entrusted requests directly supports focused intercession rather than general prayerfulness."],
  "57": ["Completing practical support so others can contribute directly supports Helps / Service.", "Concrete setup, cleaning, or carrying requires practical capability rather than an unspecified task.", "Completing the task supplies secondary follow-through evidence."],
  "58A": ["Preparing musical parts for dependable worship contribution directly supports Music / Worship.", "Practising a musical skill for shared service supports craftsmanship secondarily under the broad artistic/practical source definition; this is correlated musical evidence, not an independent confirmation."],
  "59A": ["Adapting music for actual worship participation supports Music / Worship.", "Musical adaptation to participants directly supports creative expression, unlike choosing a familiar song alone."],
  "61A": ["Expressing trust in God's care during group uncertainty supports Faith rather than general optimism.", "Encouraging a next step provides limited Exhortation evidence, not proof of unusual faith."],
  "62A": ["Planning sustained sharing within responsibilities directly supports intentional Giving.", "Allocating resources across recurring commitments is limited organizing evidence, not a wealth signal."],
};
for (const [id,rationales] of Object.entries(additionalRationales)) {
  assert.equal(byId[qid(id)].maps.length, rationales.length, id);
  byId[qid(id)].maps.forEach((m,i) => m[3] = rationales[i]);
}
const personalityConcerns = {
  "58": ["Caregiving demands or sensory fatigue, not stable social preference, may determine recovery.", "Busy week and privacy have different cultural meanings."],
  "59": ["Language confidence or a group's safety may determine silence.", "Talking first is not a better leadership norm."],
  "60": ["Access to trusted partners can determine solitary reflection.", "Both reflection and exchange can occur sequentially."],
  "61": ["A particular ethical dilemma may determine the chosen pole.", "People and principles are not opposites in all cultures."],
  "62": ["Relationship protection may itself be a clear standard.", "Both poles may sound morally required; cognitive testing needed."],
  "63": ["Fairness can include personal impact; poles overlap.", "Collective fairness and consistency differ across communities."],
  "64": ["An employer's rules can force an early plan.", "Projects include ordinary shared tasks; no formal project culture assumed."],
  "65": ["Safety constraints may demand a fixed plan.", "Returning to a plan may not oppose adjusting; translation review required."],
  "66": ["Uncertainty or current stress can shift comfort.", "Neither pole is maturity or reliability."],
  "67": ["Training may direct attention to a particular level.", "Details and patterns need concrete local examples without changing poles."],
  "68": ["Urgent necessity can override usual future attention.", "What this could become is abstract; retain but test translations."],
  "69": ["Job function may privilege steps or ideas.", "Avoid valuing one pole as more intelligent."],
  "70": ["Authority or resources may permit only support.", "First movement is metaphorical; flag for later consented revision, not silently edit."],
  "71": ["Opportunity determines whether new ideas can be tried.", "Improvement can itself be initiative; this is preference, not Apostle."],
  "72": ["Hierarchy, gender norms, or danger may constrain role choice.", "Support is not passivity or lesser leadership."],
  "73": ["Employment and caring obligations may force routine.", "Ideal week is hypothetical and may differ from observed routine."],
  "74": ["Urgency or health may dictate response speed.", "Sustainable and fast are not true opposites; retain unchanged with a measurement flag."],
  "75": ["Job design rather than preference can determine variety.", "Predictable rhythms is figurative; local cognitive review required."],
  "76": ["Language, safety, or availability may limit group work.", "Brainstorming is English workplace jargon; translation-equivalence review pending."],
  "77": ["Shared accountability may coexist with personal ownership.", "Avoid Western individualism; both poles can coexist."],
  "78": ["Team quality may shape perceived healthy responsibility.", "Own a task is figurative; cultural review is a flagged limitation, not a covert rewrite."],
};
for (const q of bank.coreQuestions.filter(q => q.maps[0][0] === "Personality")) {
  const [alternativeExplanation,culturalTranslationReview] = personalityConcerns[q.id.slice(5)];
  q.itemAudit = {alternativeExplanation,culturalTranslationReview,uniqueValue:`One of the three retained ${q.maps[0][1]} preference contexts; no claimed independence or reliability from three items.`,decision:"Preserve exact baseline ID, wording, round, response model, poles, and maps as requested; flag overlap/translation issues for cognitive review. No ministry inference."};
}
for (const q of bank.coreQuestions) {
  q.module = "adult-integrated-core";
  q.toggleBindings = q.maps.map(([category,construct,weight]) => ({
    category, construct, weight,
    activeWhen: category === "Spiritual Gift" ? `enabledSpiritualGifts includes exact source name: ${construct}` : `${category} and ${construct} enabled in frozen attempt`,
  }));
  q.visibilityRule = "Show if at least one map is active; remove only a disabled map, not other categories' uses.";
  q.eligibility = ["EP-I-37","EP-I-38","EP-I-39"].includes(q.id) ? "Celibacy enabled AND adult self-identifies as currently unmarried and opts into these sensitive items. Married, unknown, or declined: three conditionally resolved N/A; never infer a vocation from status." : "Adult pathway; N/A available where opportunity or experience is absent.";
  if (q.maps[0][0] !== "Personality") {
    q.qualityReview = {
      oneClearBehavior: {status:["27","46"].includes(q.id.slice(5)) ? "Qualified" : "Editorial pass",review:`Focal behavior: ${q.text} ${["27","46"].includes(q.id.slice(5)) ? "Contains linked components; test whether respondents answer them differently rather than treating this as an unconditional pass." : "Examples or context specify the behavior, not separate rating requests."}`},
      ordinaryLife: {status:"Qualified",review:q.maps.some(m=>m[0]==="Spiritual Gift"||m[0]==="APEST") ? "Can use informal household, peer, work, or community experience where the named faith/service behavior actually occurs. No formal ministry post required. Faith-specific items are not religion-neutral; never relabel a purely secular behavior as a spiritual gift. N/A if no opportunity." : "Home, work, learning, or community examples are acceptable; no formal ministry post required."},
      moralSuperiority: {status:"Residual risk",review:"Positive contribution remains socially desirable. Low, N/A, or another contribution is not less Christian; no maturity, calling, or moral ranking. Specific action replaces aspiration where rewritten."},
      translation: {status:"Not field-verified",review:q.itemAudit.culturalTranslationReview},
      constructDiscrimination: {status:"Provisional",review:q.itemAudit.alternativeExplanation},
      nonredundancy: {status:"Retained distinct context; unvalidated",review:q.itemAudit.uniqueValue},
      everyMapJustified: {status:"Editorial review, not empirical independence",review:q.maps.map(m=>`${m[0]} / ${m[1]} (${m[2]}): ${m[3]}`).join(" | ")},
      socialDesirability: {status:"Residual risk",review:`Alternative explanation remains: ${q.itemAudit.alternativeExplanation} Ask for recurring real experience, not intended good behavior. Pilot response distributions and cognitive interviews are required before claiming separation.`},
    };
  }
  if(q.maps.length===4) q.fourMappingReview = q.maps.map(([category,construct,weight,rationale])=>({
    category,construct,weight,decision:"Retain at existing weight; no primary promotion",
    necessity:rationale,
    limit:"Necessary only to represent this genuinely overlapping aspect in the proposed content model, not because the coverage total needs padding. Same answer is correlated evidence across categories; this is not four independent observations."
  }));
}
bank.proposalVersion = "final-integrated-content-review-v3";
bank.status = "REPORT ONLY — 83-slot editorial candidate; not approved for implementation or psychometrically validated. No safe item-count reduction identified in this bank in this pass.";
bank.scope = {noLiveChanges:true, adultOnlyPilot:true, productionStatus:"Current workspace source inspected, not deployed production. It may differ from published production; no live verification claimed."};
bank.mappingPolicy = {
  weights:{primary:1,secondary:0.5},
  maxMaps:4,
  formula:"Per construct: sum(answer * active map weight) / sum(answered active map weights). Keep on 1–5 scale; do not use raw sums for cross-construct rankings.",
  publishingThreshold:"At least three distinct answered meaningful active IDs. Count secondary only if behavior directly supports it. No stricter three-primary rule. Content eligibility and pending taxonomy decisions still govern whether a numeric result is appropriate.",
  missing:"N/A, skipped, missing, disabled, and ineligible have no numerator or weight denominator. N/A is resolved for completion, not scored. Missing is unresolved, not zero or midpoint. Fewer than three meaningful answered IDs: Not enough information yet.",
  evidence:"Show primary answered/available, secondary answered/available, distinct answered/available, answered weighted denominator and weighted opportunities separately. Shared items are correlated evidence.",
  completion:"Progress denominator is visible active items. Resolved numerator is numeric answers plus explicit N/A. Keep answered, N/A, skipped/unresolved, and eligibility omissions separately; all resolved does not mean every construct has enough evidence.",
  interpretation:"No forced top N, no lowered cutoffs, no unvalidated strong/moderate bands. Show recurring stronger versus secondary/developing patterns with actual evidence and ties. Many genuine high results are allowed.",
};
bank.responseModels.reflectionLikert.instructions = "Answer from recurring actual behavior, not what you think a good Christian should say. There is no preferred contribution. Use N/A if opportunity is absent; a low response is not a judgment of faithfulness.";
bank.responseModels.specialExperienceLikert.na = "Not sure / I have not experienced this / this is not part of my church tradition";
bank.responseModels.specialExperienceLikert.scoring = "All optional responses unscored, including numeric choices; context is never proof. Frequency/fit choices are conversation aids, not gift evidence thresholds.";
const specialFour = ["Healing","Miracles","Tongues","Interpretation of Tongues"];
bank.proposedClassificationsPendingApproval = [
  ...specialFour.map(construct=>({construct,treatment:"Optional Spiritual Experience & Discernment; approved in principle only, not implemented; no automated gift score or proof."})),
  {construct:"Prophecy",treatment:"Recommendation C: conversation/community-led discernment pending approval; retain one source taxonomy name. Not automatically classified with the special four. Conditional three-prompt discussion appendix available only if C is approved."},
  {construct:"Discernment of Spirits",treatment:"Recommend conversation/community discernment pending approval. Zero appropriate scored indicators; no general Wisdom/Discernment substitutions."},
];
bank.optionalSpecialExperienceModule.status = "12 prompts for the four special gifts, approved in principle; plus 3 separately conditional Prophecy discussion prompts, recommendation C pending approval. Neither module implemented.";
bank.optionalSpecialExperienceModule.count = 15;
bank.optionalSpecialExperienceModule.approvedInPrincipleSpecialCount = 12;
bank.optionalSpecialExperienceModule.prophecyConditionalCount = 3;
bank.optionalSpecialExperienceModule.rule = "All 15 unscored. Twelve special-four prompts comprise 4 self-reported experience prompts and 8 context prompts. The separately conditional Prophecy appendix comprises 1 self-report and 2 context prompts. None verifies divine origin or constitutes a score.";
for(const q of bank.optionalSpecialExperienceModule.items) {
  q.maps=[];
  q.module=q.construct==="Prophecy" ? "prophecy-discussion-pending-C" : "optional-spiritual-experience";
  q.toggleBinding={gift:q.construct,enabledGiftRequired:true,participantOptInRequired:true,additionalApprovalRequired:q.construct==="Prophecy" ? "Prophecy recommendation C approved separately" : "Module implementation approval (treatment already approved in principle)"};
  q.responseModel="specialExperienceLikert";
  const isContext=q.kind==="context-only";
  q.itemAudit={
    alternativeExplanation:isContext ? "Humility, willingness, compliance, or a desired self-image can explain a high response; this is context, never gift proof." : q.construct==="Healing" ? "Recovery, appropriate care, expectation, or coincidence can explain perceived healing; prayer association is not causal verification." : q.construct==="Miracles" ? "Coincidence or incomplete knowledge can explain an extraordinary-seeming outcome; no supernatural causation inferred." : q.construct==="Interpretation of Tongues" ? "Language knowledge, suggestion, or community expectations may explain a perceived interpretation; accuracy is not established." : q.construct==="Prophecy" ? "Ordinary encouragement, inference, or a subjective impression may explain the message; divine origin is not established." : "Learned practice, language experience, or community expectations may explain an utterance; divine origin is not established.",
    culturalTranslationReview:`${q.construct} terminology is tradition-dependent. Preserve the exact tradition-sensitive unscored option; local church and translator review required. Participation, publicity, and agreement with authority must never be required.`,
    uniqueValue:`${q.id}: ${isContext ? q.text.includes("guidance")||q.text.includes("confirmation") ? "Guidance/confirmation context, separate from experience and respectful practice." : "Respectful-practice/accountability context; not additional experience evidence." : "A self-reported experience opening for conversation; not three independent gift indicators."}`,
    decision:"Retain as unscored discussion text, with no evidence threshold or automated proof; Prophecy additionally awaits classification approval."
  };
}
const sourcePath="artifacts/every-part/src/pages/assessment.tsx";
const source=fs.readFileSync(sourcePath,"utf8");
const lines=source.split("\n");
const excerpt=(start,end)=>lines.slice(start-1,end).join("\n");
bank.sourceReview={
  provenance:{path:sourcePath,sha256:hash(source),verification:"Workspace file only; not verified against published production."},
  prophecy:{lines:"311–320",definition:"communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction",prompts:[
    "I share messages I believe God has prompted for another person's strengthening, correction, encouragement, or direction.",
    "I seek discernment, confirmation, and feedback when sharing such impressions.",
    "I hold spiritual impressions humbly and submit them to wise discernment.",
    "I consider how a spiritual impression might be shared in a way that serves others with care and accountability.",
  ],excerpt:excerpt(311,320),assessment:"The source blends ordinary strengthening/correction purposes with messages believed prompted by God and spiritual impressions. It does not explicitly say foretelling unknown events or information unavailable ordinarily. Three of four prompts primarily describe posture. This is not the same as an ordinary biblical-truth three-indicator bank.",
  options:[
    {option:"A",proposal:"Keep one carefully defined Prophecy gift; seek approval to clarify ordinary prophetic ministry scope and then develop at least three genuine scored indicators. Extraordinary claims stay unscored discussion. No approved wording or count for this alternative yet."},
    {option:"B",proposal:"Separate ordinary prophetic ministry from extraordinary experience only with explicit taxonomy approval. Not recommended in this pass: it changes taxonomy and requires new definitions and coverage. No split created."},
    {option:"C",proposal:"Keep the one existing Prophecy name and use conversation/community-led discernment for now; optionally offer the three unscored discussion prompts after specific approval. Recommended while mixed scope remains unresolved, not because Prophecy is inherently equivalent to the special four."},
  ],recommendation:"C pending owner/theological approval. A remains viable after scope approval and three meaningful indicators. Do not label this taxonomy decision approved."},
  discernmentOfSpirits:{lines:"171–180",definition:"recognizing what is from God, human influence, or spiritual deception",prompts:[
    "I prayerfully distinguish what may be from God, human influence, or spiritual deception.",
    "My careful listening helps others consider spiritual impressions or concerns wisely.",
    "I pause, pray, and seek wise counsel before naming what I sense.",
    "I value humility and community discernment when considering what may be influencing a ministry situation.",
  ],excerpt:excerpt(171,180),recommendation:"Conversation / Community Discernment Only pending approval. Source is spiritual-source discernment, not general judgment, emotion, theology, or critical thinking. One claimed distinguishing behavior plus posture/listening does not establish three appropriate indicators. Retain taxonomy; zero scored maps and no fabricated replacements."},
};
for(const rec of [bank.sourceReview.prophecy,bank.sourceReview.discernmentOfSpirits]) {
  assert(source.includes(rec.definition)); for(const prompt of rec.prompts) assert(source.includes(prompt));
}
const taxonomies={"APEST":bank.sourceTaxonomy.apests,"Spiritual Gift":bank.sourceTaxonomy.gifts,"Strength":bank.sourceTaxonomy.strengths,"Personality":bank.sourceTaxonomy.personalitySpectra};
function coverage(questions) {
  return Object.entries(taxonomies).flatMap(([category,names])=>names.map(construct=>{
    const primaryIds=[],secondaryIds=[];
    for(const q of questions) for(const m of q.maps) if(m[0]===category&&m[1]===construct) (m[2]===1?primaryIds:secondaryIds).push(q.id);
    const primary=primaryIds.length,secondary=secondaryIds.length,distinct=primary+secondary,weighted=primary+secondary/2;
    const flags=[];
    if(category==="APEST"&&weighted===5.5) flags.push("exact weighted floor");
    if(category!=="APEST"&&distinct===3) flags.push("exact distinct minimum; any one N/A blocks a score");
    if((category==="Strength"||category==="Spiritual Gift")&&distinct>5) flags.push("unusually high: >5 opportunities (editorial review flag, not threshold)");
    if(secondary>primary) flags.push("secondary-heavy: S>P");
    else if(secondary>0&&secondary===primary) flags.push("equal primary/secondary counts");
    if(category==="Spiritual Gift"&&["Prophecy","Discernment of Spirits",...specialFour].includes(construct)) flags.push(construct==="Prophecy"||construct==="Discernment of Spirits"?"zero; classification decision pending":"zero; special experience unscored");
    if(category==="Spiritual Gift"&&construct==="Celibacy") flags.push("conditional; conceptual scope/calling safeguard");
    return {category,construct,primary,secondary,distinct,weighted,primaryIds,secondaryIds,flags};
  }));
}
bank.coverage=coverage(bank.coreQuestions);
const baseCoverage=coverage(baseline.coreQuestions);
const sig=q=>q.maps.map(m=>m.slice(0,3));
bank.baselineDiff={
  comparison:baselinePath,
  added:bank.coreQuestions.filter(q=>!original[q.id]).map(q=>q.id),
  removed:baseline.coreQuestions.filter(q=>!byId[q.id]).map(q=>q.id),
  replaced:bank.coreQuestions.filter(q=>q.change==="replaced-in-place").map(q=>q.id),
  rewritten:bank.coreQuestions.filter(q=>q.text!==original[q.id].text&&q.change!=="replaced-in-place").map(q=>q.id),
  mappingChanged:bank.coreQuestions.filter(q=>JSON.stringify(sig(q))!==JSON.stringify(sig(original[q.id]))).map(q=>q.id),
  weightPromotions:[],
  removedMappings:Object.entries(removedMapReasons).map(([key,reason])=>{const [id,category,construct]=key.split("|");return {id:qid(id),category,construct,oldWeight:original[qid(id)].maps.find(m=>m[0]===category&&m[1]===construct)[2],reason};}),
  addedMappings:[],
  details:bank.coreQuestions.filter(q=>q.text!==original[q.id].text||JSON.stringify(sig(q))!==JSON.stringify(sig(original[q.id]))).map(q=>({id:q.id,action:q.change,oldText:original[q.id].text,newText:q.text,oldMaps:original[q.id].maps,newMaps:q.maps})),
  optionalItemsAdded:[],optionalItemsRemoved:[],optionalItemsRewritten:[],
  metadataChanges:"All item audits/toggle bindings added; rationale edits separately represented. Optional Prophecy binding is now separately approval-gated, not automatically special. Source review, rules and classifications replace baseline overclaims.",
};
// Exhaustive single-removal ledger, plus combined rejected sets: arithmetic is NOT a deletion decision.
function impact(ids,questions=baseline.coreQuestions) {
  const after=coverage(questions.filter(q=>!ids.includes(q.id)));
  const affected=new Set(questions.filter(q=>ids.includes(q.id)).flatMap(q=>q.maps.map(m=>`${m[0]}|${m[1]}`)));
  return after.filter(c=>affected.has(`${c.category}|${c.construct}`)).map(c=>({...c,belowFloor:c.category==="APEST"?c.weighted<5.5:c.distinct<3}));
}
bank.removalReview=baseline.coreQuestions.map(q=>({
  id:q.id,oldText:q.text,oldMaps:q.maps,
  otherSupportingIds:baseCoverage.filter(c=>q.maps.some(m=>m[0]===c.category&&m[1]===c.construct)).map(c=>({category:c.category,construct:c.construct,ids:[...c.primaryIds,...c.secondaryIds].filter(id=>id!==q.id)})),
  baselineAfterSingleRemoval:impact([q.id]),
  finalAfterSingleRemoval:impact([q.id],bank.coreQuestions),
  proposedRemoval:false,
  decision:q.maps[0][0]==="Personality" ? "Reject removal: preserve all 21 independent items; a spectrum would fall to two." : `Reject removal. ${byId[q.id].itemAudit.uniqueValue} ${impact([q.id],bank.coreQuestions).some(c=>c.belowFloor)?"At least one floor would also fail.":"Arithmetic allows this deletion, but unique content would be lost or already thin direct evidence weakened. No safe low-unique-value deletion established."}`
}));
bank.combinedRemovalCandidates=[
  {ids:["EP-I-10","EP-I-43","EP-I-62A"],why:"Rejected nominal 80-core shortcut: 10 contributes exclusion identification; 43 immediate responsive giving; 62A regular planned sharing. Together Giving falls below three; low mathematical surplus is not redundant content."},
  {ids:["EP-I-07","EP-I-12","EP-I-13","EP-I-14","EP-I-21","EP-I-50"],why:"Rejected 77-core shortcut: apparent values/care overlap is not interchangeable. The four Prophet items distinguish noticing, neglected care, systemic burden, and decision application; 21/50 distinguish distress follow-up and withdrawal. Combined cuts break APEST and related evidence."},
  {ids:["EP-I-25","EP-I-54"],why:"Rejected prayer merge: 25 persistence/trust despite no visible change differs from 54 entrusted recurring requests. Combined removal cannot be justified as a single prayer indicator and breaks Intercession/Faith evidence."},
  {ids:["EP-I-35","EP-I-58A","EP-I-59A"],why:"Rejected music merge: participation, rehearsed skill, and adaptation are distinguishable. A single broad music question would erase all three Music / Worship indicators, not responsibly shorten."},
  {ids:["EP-I-28","EP-I-29","EP-I-31","EP-I-53"],why:"Rejected teaching compression: study, explanation, diagnosing confusion and checking understanding have different evidence. Teacher coverage falls well below floor."},
  {ids:["EP-I-40","EP-I-41","EP-I-42"],why:"Most semantically similar cluster; replacing all with one simpler-life item would leave one Voluntary Poverty indicator. Retain conditional three-facet proposal with redundancy risk, or seek approval for conversation treatment later; do not pretend reliable measurement."},
].map(c=>({...c,baselineAfterCombinedRemoval:impact(c.ids),finalAfterCombinedRemoval:impact(c.ids,bank.coreQuestions),afterEachSingle:c.ids.map(id=>({id,coverage:impact([id],bank.coreQuestions)})),decision:"Rejected; no removals or merges proposed."}));
bank.safeReductions={itemsRemoved:0,scoringMapsRemoved:6,conclusion:"No safe item-count reductions identified in this bank in this pass. Six unsupported or unnecessarily duplicated scoring associations removed; one weak item replaced in its slot. 83 retained, not a globally shortest or optimal instrument."};
bank.toggleAndSnapshotPolicy={
  currentSource:"assessment.tsx 1618–1623 filters church enabled gifts and excludes Celibacy when familySituation starts with Married. api spiritual-gifts.ts 13–35 requires at least three enabled gifts. No configuration or behavior changed.",
  proposal:"Each exact-name gift binding disables only that gift's maps. Keep an item while another active map uses it. Gift-only inactive items disappear. Shared wording must also be reviewed for church acceptability; map removal does not remove all faith words. No hidden score for disabled gifts.",
  special:"Special module requires participant opt-in, gift toggle and future module approval. Prophecy appendix additionally requires separate C approval, never just the special-four switch. Discernment of Spirits creates no extra counted prompts.",
  snapshots:"Future attempt-start snapshot must freeze ordered IDs, exact displayed wording and translation, active maps/weights, response models, content/scoring versions, enabled gifts/sections, eligibility/opt-in resolutions, and timestamps. Resume from that immutable snapshot. Later toggle/wording changes apply only to new attempts. Not implemented or live-verified.",
  history:"No migration, rescore, relabel, or overwrite of completed historical profiles. Preserve youth and every nonassessment section. Preserve current Serving Pattern computation; future adapters require an explicit separately approved contract.",
};
bank.countScenarios=[
  {id:"all-enabled-C-eligible",core:83,optional:15,total:98,condition:"All other categories and ordinary gifts on; Celibacy opted-in eligible; special module opted in and all four on; Prophecy C separately approved and enabled."},
  {id:"all-enabled-C-ineligible",core:80,optional:15,total:95,condition:"Same, but Celibacy off/ineligible/declined; 3 slots conditionally resolved N/A, not displayed."},
  {id:"four-only-eligible",core:83,optional:12,total:95,condition:"All ordinary gifts including eligible Celibacy on; all four special gifts on and module opted in; Prophecy unresolved, C not approved, or Prophecy off."},
  {id:"four-only-ineligible",core:80,optional:12,total:92,condition:"Same with Celibacy off/ineligible/declined."},
  {id:"special-disabled-C-on-eligible",core:83,optional:3,total:86,condition:"Exactly the four special gifts off; Prophecy C separately approved, enabled, and opted in; eligible Celibacy on."},
  {id:"special-disabled-C-on-ineligible",core:80,optional:3,total:83,condition:"Same with Celibacy off/ineligible/declined."},
  {id:"all-optional-off-eligible",core:83,optional:0,total:83,condition:"Four special gifts and Prophecy appendix off (or whole optional module declined); eligible Celibacy on."},
  {id:"all-optional-off-ineligible",core:80,optional:0,total:80,condition:"Same with Celibacy off/ineligible/declined."},
];
bank.timeEstimate={
  assumptions:"62 behavior items at 12–18 seconds plus 21 bipolar items at 15–22 seconds, plus 2–4 minutes instructions/review = 19.65–30.3 minutes.",
  core:"Plan 20–31 minutes for 83 visible core; 3 Celibacy omissions save approximately 0.6–0.9 minutes.",
  optional:"At 15–25 seconds per prompt plus 1–2 minutes introduction: 12 prompts 4–7 minutes; 15 prompts 5–9 minutes; 3-prompt Prophecy-only appendix about 2–4 minutes.",
  total:"All 98 visible: approximately 25–40 minutes. Translation, accessibility, reflection and conversation can take longer.",
  limitation:"Planning arithmetic only, no timed pilot or participant dataset received. Pilot median and upper-tail time, comprehension, N/A and break-off before setting product expectations.",
};
bank.remainingConcerns=[
  "No participant dataset received. No empirical testing, factor/reliability study, translation validation or live verification performed.",
  "All scored candidates meet structural floors after editorial repair; three relevant self-report indicators are not proof of reliability, construct validity, calling, or gift possession.",
  "Secondary-heavy Leadership and Mercy Gifts, Adaptability and Strategic thinking Strengths retain only one primary each. Helps / Service is 1P/3S. Mean scores must not hide this.",
  "Celibacy's three revised contexts and Voluntary Poverty's three related facets remain conceptually fragile and opportunity-sensitive; they cannot establish a lifelong vocation or rank holiness. Do not auto-reclassify; seek scope approval and cognitive review before score publication.",
  "Faith's unusual-confidence definition is difficult to distinguish from ordinary faithful coping; God-specific rewrites remove pure optimism but do not empirically establish unusual confidence.",
  "Prophet remains corrective biblical/ethical ministry, not automatic Prophecy Gift. Wisdom is contextual spiritual application; Strength Discernment is practical evaluation, never Discernment of Spirits.",
  "Some scripture, music, celibacy and cross-cultural items necessarily require relevant experience. Ordinary-life answerability means no formal ministry role, not that every adult should have the opportunity.",
  "Independent personality scoring is preserved, not statistical independence. Existing poles have conceptual overlap and translation issues (especially Decision Lens, Pace Preference, Work Style). No silent wording edits.",
  "Shared questions can co-elevate related categories even with valid maps. Weights normalize opportunities but cannot correct social desirability or provide independent confirmation.",
  "Actual source derives fixed-size summaries in several consumers; proposal must not be fed into those consumers without separately approved adapters. No application change is authorized here.",
];
bank.scoringSourceAudit=[
  {path:"artifacts/every-part/src/pages/assessment.tsx",lines:"1659–1707; 2158–2186; 2288–2318",finding:"Current APEST sums configured 1–4 prompts per orientation; missing values default to zero in submission derivation. Strengths sum prompts and submit the five highest labels. Gift submission stores prompt/response arrays, not integrated weighted numeric gift results. The proposed 1/.5 cross-map scoring is not the live algorithm."},
  {path:"artifacts/every-part/src/pages/profile-detail.tsx",lines:"54–69; 84–89; 149–189",finding:"rankedApproaches sums matching numeric response keys, without a three-meaningful-item gate. Gift display shows selected legacy conversation gifts and reflection responses, not the proposed percentage scores. Strength fallback selects five. Personality derivation fills missing entries with 3 once a dimension has an answer; that is a separate legacy behavior, not this proposal's missing-data policy."},
  {path:"artifacts/every-part/src/lib/my-profile-derivation.ts",lines:"47–150; 239–276",finding:"Serving Pattern uses normalized available personality signals (90%) plus normalized selected-strength support capped at 10%; no gifts/APEST in that numeric function. Strength fallback top five; legacy gift summary takes up to three stored topGifts. Broader narrative synthesis uses other categories, not the Serving Pattern numeric score."},
  {path:"artifacts/api-server/src/lib/profile-helper-signals.ts",lines:"61–83",finding:"Gift helper uses stored selected gifts if present, otherwise arithmetic mean of numeric reflection responses, positive means sorted and top five selected. No three-item evidence gate here; never call helper rankings validated assessment scores."},
  {path:"artifacts/api-server/src/lib/volunteer-matching.ts",lines:"81–102",finding:"Matching gift fallback likewise averages numeric entries, keeps any positive mean and selects top five. It can select weak or tied positive reflections; unrelated to a validated high-score cutoff."},
  {path:"artifacts/api-server/src/lib/team-suggestions.ts",lines:"114–136",finding:"Team suggestions repeat positive-mean/top-five gift derivation. Consumer divergence matters: profile display, summaries and helpers do not all calculate the same result."},
  {path:"artifacts/api-server/src/lib/spiritual-gifts.ts",lines:"13–35; 37–70",finding:"Current configuration requires at least three enabled source gifts. Submission requires each active gift's configured count with integer 1–5 responses; there is no current N/A format accepted here. Future N/A/snapshot rules are design proposals, not functionality claimed to work today."},
];
bank.scoringMechanisms=[
  "User reports many high scores, but no participant responses, scoring trace, or deployed version were provided. Cannot reproduce the case or attribute causation empirically.",
  "Current positive-faithful/posture wording can invite high self-ratings across gifts. Prophecy, Discernment and special-gift source prompts include humility/care/guidance: these are not evidence of a supernatural gift.",
  "Raw sums favor more answered items when counts differ; rank order can make small/no differences look categorical. Stable source-order ties may determine summary labels. These are mathematical/code observations, not participant findings.",
  "Integrated proposal weighted mean example: responses 4,4,4 at weights 1,.5,.5 produce (4+2+2)/2=4, not a lower score. Halving secondary weight does not lower uniform high endorsement. Shared high answers can elevate every mapped construct.",
  "Opportunity normalization prevents a six-item construct automatically scoring higher than a three-item construct, but differing item difficulty, social desirability and narrow repeated content still affect comparability.",
  "Six map removals and specific-behavior repairs address actual content mechanisms; no threshold changed to create dramatic separation, no fixed top-N restriction added, no inverse moral items invented.",
  "Future score display should show actual recurring patterns, developing/secondary evidence and ties without fabricated cutoffs. Retain many genuine gifts; no percentile or high-score prevalence claim without an appropriate dataset.",
];
// Manifest records only sources actually inspected; no deployment provenance invented.
bank.provenance = {
  baselineFiles:originalHashes,
  prompt:{path:"attached_assets/Pasted-Yes-Here-s-the-prompt-I-would-give-Replit-now-for-the-f_1789748325061.txt",sha256:hash(fs.readFileSync("attached_assets/Pasted-Yes-Here-s-the-prompt-I-would-give-Replit-now-for-the-f_1789748325061.txt"))},
  inspectedSourceFiles:[...new Set([sourcePath,...bank.scoringSourceAudit.map(x=>x.path)])].map(path=>({path,sha256:hash(fs.readFileSync(path))})),
  noLiveVerification:true,
};
delete bank.verificationSummary;

// Structural validation reports facts, not an all-green conceptual approval.
const checks=[];
function check(name,fn) {fn();checks.push({name,status:"PASS"});}
check("Baseline cardinalities are 83 core / 15 optional / 5,26,18,7 taxonomy",()=>{
  assert.equal(baseline.coreQuestions.length,83);assert.equal(baseline.optionalSpecialExperienceModule.items.length,15);
  assert.deepEqual(Object.values(taxonomies).map(x=>x.length),[5,26,18,7]);
});
check("Final core/optional IDs unique and disjoint; stable order complete",()=>{
  const core=bank.coreQuestions.map(q=>q.id),optional=bank.optionalSpecialExperienceModule.items.map(q=>q.id);
  assert.equal(new Set([...core,...optional]).size,98);
  assert.deepEqual([...bank.stablePresentationOrder].sort(),[...core].sort());
  assert.deepEqual([...bank.stableOptionalPresentationOrder].sort(),[...optional].sort());
});
check("All maps valid numeric weights, distinct category/construct keys, max four; explicit rationale",()=>{
  for(const q of bank.coreQuestions) {
    assert(q.maps.length>=1&&q.maps.length<=4);
    assert.equal(new Set(q.maps.map(m=>`${m[0]}|${m[1]}`)).size,q.maps.length);
    for(const [category,construct,weight,rationale] of q.maps) {assert(taxonomies[category].includes(construct));assert([1,.5].includes(weight));assert(rationale.length>20);}
    for(const category of Object.keys(taxonomies)) assert(q.maps.filter(m=>m[0]===category&&m[2]===1).length<=1);
  }
});
check("APEST at least 5.5 each and spread at most 0.5",()=>{
  const apest=bank.coverage.filter(c=>c.category==="APEST").map(c=>c.weighted);
  assert(Math.min(...apest)>=5.5);assert(Math.max(...apest)-Math.min(...apest)<=.5);
});
check("20 proposed ordinary gift candidates and all 18 strengths have >=3 distinct IDs (editorial relevance still provisional)",()=>{
  const ordinary=bank.coverage.filter(c=>c.category==="Spiritual Gift"&&![...specialFour,"Prophecy","Discernment of Spirits"].includes(c.construct));
  assert.equal(ordinary.length,20);
  for(const c of [...ordinary,...bank.coverage.filter(c=>c.category==="Strength")]) assert(c.distinct>=3, c.construct);
});
check("All 21 Personality semantic fields exactly preserved and independently mapped",()=>{
  const personalities=bank.coreQuestions.filter(q=>q.maps.some(m=>m[0]==="Personality"));
  assert.equal(personalities.length,21);
  for(const q of personalities) {for(const field of ["id","round","text","responseModel","poles","maps"])assert.deepEqual(q[field],original[q.id][field]);assert.equal(q.maps.length,1);}
  for(const q of bank.coreQuestions.filter(q=>!personalities.includes(q)))assert(!q.maps.some(m=>m[0]==="Personality"));
  for(const c of bank.coverage.filter(c=>c.category==="Personality")) assert.equal(c.distinct,3);
});
check("Mixed presentation order retained exactly; not category-block scoring order",()=>{
  assert.deepEqual(bank.stablePresentationOrder,baseline.stablePresentationOrder);
  const flags=bank.stablePresentationOrder.map(id=>byId[id].maps[0][0]==="Personality");
  const switches=flags.slice(1).filter((x,i)=>x!==flags[i]).length;
  assert(switches>20);assert(flags.some(Boolean));assert(flags.some(x=>!x));
});
check("Every final item audited; every behavior has eight quality checks; every four-map item has four explicit reviews",()=>{
  for(const q of [...bank.coreQuestions,...bank.optionalSpecialExperienceModule.items])for(const field of ["alternativeExplanation","culturalTranslationReview","uniqueValue","decision"])assert(q.itemAudit[field].length>15);
  for(const q of bank.coreQuestions) {if(q.maps[0][0]!=="Personality")assert.equal(Object.keys(q.qualityReview).length,8);if(q.maps.length===4)assert.equal(q.fourMappingReview.length,4);}
});
check("No added maps or weight promotions; six explicit removals and no item removals",()=>{
  assert.equal(bank.baselineDiff.removed.length,0);assert.equal(bank.baselineDiff.added.length,0);
  assert.equal(bank.baselineDiff.removedMappings.length,6);
  for(const q of bank.coreQuestions)for(const m of q.maps)assert(original[q.id].maps.some(x=>JSON.stringify(x.slice(0,3))===JSON.stringify(m.slice(0,3))));
});
check("All optional prompts unscored; special four 12 and separately gated Prophecy three",()=>{
  assert.equal(bank.optionalSpecialExperienceModule.items.filter(q=>q.construct!=="Prophecy").length,12);
  assert.equal(bank.optionalSpecialExperienceModule.items.filter(q=>q.construct==="Prophecy").length,3);
  for(const q of bank.optionalSpecialExperienceModule.items)assert.equal(q.maps.length,0);
});
check("Toggle semantics simulated for every gift: remove map only; hide zero-use items",()=>{
  for(const gift of bank.sourceTaxonomy.gifts) {
    const simulated=bank.coreQuestions.map(q=>({...q,maps:q.maps.filter(m=>!(m[0]==="Spiritual Gift"&&m[1]===gift))})).filter(q=>q.maps.length);
    for(const q of simulated)assert(!q.maps.some(m=>m[0]==="Spiritual Gift"&&m[1]===gift));
    for(const q of bank.coreQuestions.filter(q=>q.maps.some(m=>m[0]!=="Spiritual Gift"||m[1]!==gift)))assert(simulated.some(x=>x.id===q.id));
  }
});
check("All eight count scenarios independently recomputed",()=>{
  for(const c of bank.countScenarios) {
    const omitCelibacy=c.id.endsWith("ineligible");
    const count=bank.coreQuestions.filter(q=>!omitCelibacy||!["EP-I-37","EP-I-38","EP-I-39"].includes(q.id)).length;
    const optional=c.id.startsWith("all-enabled")?15:c.id.startsWith("four-only")?12:c.id.startsWith("special-disabled")?3:0;
    assert.equal(c.core,count);assert.equal(c.optional,optional);assert.equal(c.total,count+optional);
  }
});
check("Source quotations match inspected source; source taxonomy exactly present",()=>{
  for(const rec of [bank.sourceReview.prophecy,bank.sourceReview.discernmentOfSpirits]) {assert(source.includes(rec.definition));for(const p of rec.prompts)assert(source.includes(p));}
  for(const gift of bank.sourceTaxonomy.gifts)assert(source.includes(`"${gift}"`));
});
bank.validation={checks,interpretation:"Structural content tests only. Editorial meaning is not executable validation. No app, database, participant, deployed-site, psychometric, or translation tests were run."};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const list=items=>`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
const table=(headers,rows)=>`<div class="scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const maps=q=>q.maps.map(m=>`${esc(m[0])} · <strong>${esc(m[1])}</strong> · ${m[2]===1?"Primary 1":"Secondary 0.5"}<br><small>${esc(m[3])}</small>`).join("<hr>");
const coverageTable=rows=>table(["Construct","P","S","Distinct","Weight","Primary IDs","Secondary IDs","Review"],rows.map(c=>[
  esc(c.construct),c.primary,c.secondary,c.distinct,c.weighted.toFixed(1),esc(c.primaryIds.join(", ")||"—"),esc(c.secondaryIds.join(", ")||"—"),esc(c.flags.join("; ")||"Within proposed opportunity range; not validated")
]));
const impactTable=rows=>table(["Construct","P / S / distinct / weight after removal","Other remaining IDs","Floor"],rows.map(c=>[esc(`${c.category}: ${c.construct}`),`${c.primary} / ${c.secondary} / ${c.distinct} / ${c.weighted}`,esc([...c.primaryIds,...c.secondaryIds].join(", ")||"None"),c.belowFloor?"BELOW":"Arithmetic only: meets"]));
const sections=[];
function section(id,title,content){sections.push(`<section id="${id}"><h2>${esc(title)}</h2>${content}</section>`);}
section("decision","Decision brief: preserve 83; repair evidence before shortening",`
<div class="callout"><strong>Report only. Not ready for unqualified score publication.</strong> 83 core slots remain: 62 behavior + 21 independently scored Personality. No safe whole-item reduction was identified in this bank in this pass. Six scoring maps are removed, zero promoted or added, and one weak slot is replaced rather than adding questions. This is not a globally shortest, optimized, trustworthy-by-proof, or psychometrically validated assessment.</div>
<p>Four results stay distinct: <strong>How You Tend to Minister — APEST</strong>; <strong>How God Has Equipped You — Spiritual Gifts</strong>; <strong>What You Are Naturally Good At — Strengths</strong>; <strong>How You Tend to Operate — Personality</strong>. Overlapping observations do not become independent proof. Keeping 83 is an honest content tradeoff, not approval to ship.</p>
<div class="cards"><div><b data-core-count="83">83 core</b><span>62 behavior · 21 unchanged Personality</span></div><div><b data-optional-count="15">12 + 3 conditional</b><span>Special four + separately approval-gated Prophecy</span></div><div><b>20–31 min</b><span>Core planning estimate · not pilot timing</span></div><div><b>6 map removals</b><span>0 new maps · 0 promotions · 0 item cuts</span></div></div>
<p>Prophecy recommendation <strong>C pending approval</strong>, with A and B explicitly considered below. Discernment of Spirits remains an unresolved conversation/community proposal, not general Wisdom. Special-four experience treatment is approved in principle, not implemented.</p>`);
const checklist=[
 ["Final core count","83 (62 behavior + 21 Personality); Celibacy omissions can reduce visible core to 80.","counts"],
 ["Optional count","12 special-four prompts + 3 separately conditional Prophecy discussion prompts; maximum 15.","optional"],
 ["Estimated completion","Core 20–31 min; all 98 visible roughly 25–40 min, assumptions and pilot limitations stated.","time"],
 ["Proposed removals","No whole items. Exhaustive 83-item removal ledger and combined rejected sets; six map removals only.","redundancy"],
 ["Proposed replacements","EP-I-36 replaces vague artistic/technical preparation with repair of a needed object in the same slot.","diff"],
 ["Rewritten questions","Exact ID list plus old/new wording in the diff; Personality untouched.","diff"],
 ["Mapping changes","Six removed associations across six IDs; no additions or promotions.","diff"],
 ["Full scoring map","All 83 questions, map roles, weights, rationales, and stable order.","bank"],
 ["APEST coverage","All 5 with P/S/distinct/weighted/IDs; 6,6,6,6,5.5.","coverage-apest"],
 ["Gift coverage","All 26 including zeros and conditional/pending classifications.","coverage-gifts"],
 ["Strength coverage","All 18 with exact coverage and IDs.","coverage-strengths"],
 ["Personality coverage","All 7 spectra, three each; exact semantic preservation.","coverage-personality"],
 ["Exactly-minimum constructs","Named automatically from final JSON, not inferred from baseline.","flags"],
 ["Unusually high coverage","Explicit >5 editorial flag for Gifts/Strengths; not a scoring cutoff.","flags"],
 ["Secondary-heavy constructs","S>P explicitly; equal counts distinguished; no three-primary threshold invented.","flags"],
 ["Every four-map item","Every map receives a necessity/limit judgment, not just map-count approval.","four"],
 ["Inflation findings","Actual source derivation plus content mechanisms; no participant dataset or empirical result claims.","inflation"],
 ["Cultural / translation","Item-specific alternative explanation and cultural review for all 98 candidate prompts; no translation validation claim.","audits"],
 ["Prophecy","Full definition and all four source prompts; A/B/C; C explicitly pending.","prophecy"],
 ["Discernment of Spirits","Full source definition/prompts; no generic discernment mapping; conversation recommendation pending.","discernment"],
 ["Special-four treatment","Healing, Miracles, Tongues, Interpretation optional unscored experience/context; approved in principle.","optional"],
 ["All-enabled count","98 eligible / 95 Celibacy omitted only if C approved; without C: 95 / 92.","counts"],
 ["Special-disabled count","Exactly four disabled: 86 / 83 if C stays on; all optional disabled: 83 / 80.","counts"],
 ["Gift ON/OFF","Untouched current controls; report simulation of proposed bindings, not future functionality falsely confirmed.","toggles"],
 ["Historical profiles","Untouched; future immutable snapshots proposed, no rescore.","boundaries"],
 ["Youth pathways","Untouched; adult report only.","boundaries"],
 ["Personality independence","All 21 retained exactly, one Personality map each, no behavioral proxy.","coverage-personality"],
 ["Remaining concerns","Conceptual fragility, opportunity, response desirability, missing data, translation, and source/consumer differences.","risks"],
];
section("requirements","All 28 requested report requirements",table(["#","Requirement","Answer / location"],checklist.map(([label,answer,id],i)=>[i+1,esc(label),`<a href="#${id}">${esc(answer)}</a>`])));
section("time","Completion-time assumptions, not observed timing",list(Object.values(bank.timeEstimate)));
section("counts","Exact participant counts and conditions",`<p>The 83-slot core includes three conditional Celibacy questions. Eligible means currently unmarried, gift enabled, and voluntarily opting in; unknown status is not presumed eligible. All other ordinary gifts, APEST, Strengths, and Personality are enabled in this table. Counts are future proposal scenarios, not the current participant flow. Prophecy A/B require a new approved design and recount; their count is not invented here.</p>${table(["Scenario","Visible core","Optional unscored","Visible total","Conditions"],bank.countScenarios.map(c=>[esc(c.id),c.core,c.optional,`<strong data-scenario="${c.id}" data-total="${c.total}">${c.total}</strong>`,esc(c.condition)]))}<p>General rule: visible total = core items with at least one enabled eligible map + 3 per enabled/opted-in special-four gift + 3 only for separately approved/enabled/opted-in Prophecy C. No Discernment of Spirits prompts are added. A Celibacy omission resolves three conditional N/A slots but does not add three visible questions.</p>`);
section("diff","Precise diff from revised 83-core baseline",`
<p>Baseline is <code>${baselinePath}</code>, not the older 64-question design. No baseline file overwritten. A replacement is counted separately from wording rewrites; mapping changes may overlap either category. Rationale-only metadata edits are not falsely counted as score-map changes.</p>
${table(["Change","Count","IDs / action"],[
 ["Added core",0,"None"],["Removed core",0,"None"],
 ["Replaced in place",bank.baselineDiff.replaced.length,esc(bank.baselineDiff.replaced.join(", "))],
 ["Other rewritten",bank.baselineDiff.rewritten.length,esc(bank.baselineDiff.rewritten.join(", "))],
 ["Mapping changed",bank.baselineDiff.mappingChanged.length,esc(bank.baselineDiff.mappingChanged.join(", "))],
 ["Weight promotions / added maps",0,"None"],["Removed maps",6,"Six explicit secondary/primary associations below; remaining weights unchanged."],
 ["Optional item text/ID changes",0,"All 15 retained; Prophecy approval binding and classification corrected."],
])}
${table(["ID","Removed map","Old weight","Reason"],bank.baselineDiff.removedMappings.map(m=>[esc(m.id),esc(`${m.category}: ${m.construct}`),m.oldWeight,esc(m.reason)]))}
<details><summary>Exact old/new wording and mapping signatures for every changed slot (${bank.baselineDiff.details.length})</summary>${bank.baselineDiff.details.map(d=>`<article><h3>${esc(d.id)} · ${esc(d.action)}</h3><p><strong>Old:</strong> ${esc(d.oldText)}</p><p><strong>Final:</strong> ${esc(d.newText)}</p><p><strong>Old mappings:</strong> ${esc(d.oldMaps.map(m=>`${m[0]} / ${m[1]} / ${m[2]}`).join("; "))}</p><p><strong>Final mappings:</strong> ${esc(d.newMaps.map(m=>`${m[0]} / ${m[1]} / ${m[2]}`).join("; "))}</p></article>`).join("")}</details>`);
section("redundancy","Redundancy review before any removal: single and combined effects",`
<p><strong>No item is proposed for removal or merger.</strong> Every baseline slot has an explicit ledger: old wording/maps, other IDs, baseline and repaired-bank coverage after removing it alone, and why its retained context matters. The ledger is not an optimization proof. Some item deletions are arithmetically possible; none was established as low-value enough to safely remove in this review. Six weak associations are pruned instead. Positive wording and construct scope still need testing; preserving arithmetic is not conceptual approval.</p>
<h3>Rejected combined removal candidates, with both simultaneous and individual effects</h3>
${bank.combinedRemovalCandidates.map(c=>`<details><summary>${esc(c.ids.join(", "))}</summary><p>${esc(c.why)}</p><h4>After all listed cuts together — baseline bank</h4>${impactTable(c.baselineAfterCombinedRemoval)}<h4>After all listed cuts together — repaired final bank</h4>${impactTable(c.finalAfterCombinedRemoval)}${c.afterEachSingle.map(x=>`<h4>After only ${esc(x.id)} — repaired final bank</h4>${impactTable(x.coverage)}`).join("")}</details>`).join("")}
<h3>Exhaustive current-83 single-item removal audit</h3>
${bank.removalReview.map(r=>`<details><summary>${esc(r.id)} · ${esc(r.decision)}</summary><p><strong>Old wording:</strong> ${esc(r.oldText)}</p><p><strong>Old maps:</strong> ${esc(r.oldMaps.map(m=>`${m[0]} / ${m[1]} / ${m[2]}`).join("; "))}</p>${table(["Construct","Other baseline IDs"],r.otherSupportingIds.map(c=>[esc(`${c.category}: ${c.construct}`),esc(c.ids.join(", "))]))}<h4>Baseline after this removal</h4>${impactTable(r.baselineAfterSingleRemoval)}<h4>Repaired bank after this removal</h4>${impactTable(r.finalAfterSingleRemoval)}<p>${esc(r.decision)}</p></details>`).join("")}`);
for(const [category,key] of [["APEST","apest"],["Spiritual Gift","gifts"],["Strength","strengths"],["Personality","personality"]]) {
  const rows=bank.coverage.filter(c=>c.category===category);
  section(`coverage-${key}`,`${category} coverage — complete ${rows.length}-construct source taxonomy`,
    (category==="Spiritual Gift"?`<p>20 ordinary scored <em>candidates</em> have ≥3 distinct content indicators; that is an editorial minimum, not validated evidence. Zeroes retain the taxonomy: special four are unscored experience; Prophecy and Discernment of Spirits await explicit classification approval. Celibacy is conditional and conceptually sensitive, not a declaration of vocation.</p>`:category==="Personality"?`<p>All 21 baseline texts, IDs, round assignments, poles, response models, and scoring maps are exactly retained. One Personality-only map per item. Neutral items remain in the same mixed order, not inferred from prayer, mercy, leadership, public speech, tongues, or generosity. Preference poles and cultural concerns are audited below; independent scoring does not establish statistically independent dimensions.</p>`:"")+coverageTable(rows));
}
const named=predicate=>bank.coverage.filter(predicate).map(c=>`${c.category} / ${c.construct}: ${c.primary}P + ${c.secondary}S; ${c.distinct} distinct; weight ${c.weighted}`);
section("flags","Exact minimum, unusually high, and secondary-heavy evidence",`
<p>Distinct minimum = 3 for ordinary Gift/Strength candidates and each Personality spectrum; APEST weighted floor = 5.5. “Unusually high” means >5 distinct opportunities for Gifts/Strengths only, an explicit editorial review convention, not a new publishing threshold. Secondary-heavy means S>P. No unexplained three-primary requirement is used.</p>
<h3>At the exact floor</h3>${list(named(c=>c.category==="APEST"?c.weighted===5.5:c.distinct===3))}
<h3>Above preferred 3–5 range</h3>${list(named(c=>(c.category==="Spiritual Gift"||c.category==="Strength")&&c.distinct>5))}
<h3>Secondary-heavy (S>P)</h3>${list(named(c=>c.secondary>c.primary))}
<h3>Equal counts, not secondary-heavy</h3>${list(named(c=>c.secondary>0&&c.secondary===c.primary))}
<p>A count of three includes no spare indicator: one N/A means “Not enough information yet.” Leadership and Mercy gifts, Adaptability and Strategic thinking strengths retain limited secondary evidence, not artificially promoted primaries. The final repairs make their mapped behaviors more explicit, not psychometrically stronger by assertion.</p>`);
section("bank","Full final scoring map in frozen mixed presentation order",`
<p>Primary = 1; Secondary = 0.5. Rounds are presentation headings, not inferred constructs. Stable order exactly preserves the baseline's interleaving; long behavior runs and the final three Personality slots remain visible design limitations. No claim that every round has both kinds. All active maps are independently calculated but correlated evidence.</p>
${table(["Position / ID / round","Final participant wording","Explicit maps and rationales"],bank.stablePresentationOrder.map((id,i)=>{const q=byId[id];return [`${i+1}<br><strong data-core-id="${esc(q.id)}">${esc(q.id)}</strong><br>${esc(q.round)}`,esc(q.text)+(q.poles?`<br><small>${esc(q.poles.join(" ↔ "))}</small>`:""),maps(q)];}))}`);
section("four","Every final four-mapping question: each map necessity and limit",`
<p>${bank.coreQuestions.filter(q=>q.maps.length===4).length} final items have four maps; none has more. These are retained overlapping views, not four independent pieces of evidence. APEST orientation, faith/service gift and demonstrated capability are distinct interpretations; identical labels across categories are not independent validation. Every mapping is reviewed below, including secondary ones. No map was promoted to rescue a floor.</p>
${bank.coreQuestions.filter(q=>q.maps.length===4).map(q=>`<article><h3>${esc(q.id)}</h3><p>${esc(q.text)}</p>${table(["Mapping / weight","Why retained","Limit / decision"],q.fourMappingReview.map(r=>[esc(`${r.category}: ${r.construct} / ${r.weight}`),esc(r.necessity),esc(`${r.decision}. ${r.limit}`)]))}</article>`).join("")}`);
section("inflation","High-score report: code mechanisms and content findings",`
<div class="callout">No participant dataset, scoring trace, timed pilot, or deployed version was supplied. The reported many-high-scores case cannot be reproduced. Findings below are source inspection and editorial/mathematical analysis, not empirical testing.</div>
${table(["Exact workspace provenance","Observed derivation / limitation"],bank.scoringSourceAudit.map(s=>[`${esc(s.path)}:${esc(s.lines)}`,esc(s.finding)]))}
${list(bank.scoringMechanisms)}
<p>Specific corrections: general optimism (61A) → stated trust in God's care; generic counsel (09/33) → faith truth fitted to context; newcomer help (19) → actual language/custom adaptation; generic initiative (01/02/05/44–46) → beginning/establishing new service; vague care (21–23/50–52) → spiritual support with distinct follow-up/development contexts; generic task (57) → practical completion; rehearsal no longer automatically scores creativity. Celibacy counsel-seeking and free time no longer masquerade as gift evidence. Residual social desirability and role/opportunity confounds remain explicit.</p>`);
function sourceDefinition(rec) {
  return `<p><strong>Full current workspace definition:</strong> “${esc(rec.definition)}”</p><p><code>${sourcePath}:${esc(rec.lines)}</code>; SHA-256 ${esc(bank.sourceReview.provenance.sha256)}. This file may differ from published production. No live/source deployment equivalence was verified.</p><h3>All four current source prompts (exact)</h3><ol>${rec.prompts.map(p=>`<li>${esc(p)}</li>`).join("")}</ol>`;
}
section("prophecy","Prophecy: source-led A/B/C decision, not automatic special-gift treatment",`
${sourceDefinition(bank.sourceReview.prophecy)}
<p>${esc(bank.sourceReview.prophecy.assessment)}</p>
${table(["Option","Proposal / implications"],bank.sourceReview.prophecy.options.map(o=>[o.option,esc(o.proposal)]))}
<div class="callout"><strong>Recommendation: ${esc(bank.sourceReview.prophecy.recommendation)}</strong> The optional three-prompt appendix is a conditional C design, not an approved classification. The existing source name remains unchanged. Zero ordinary Prophecy maps means no responsible score in this candidate, not no gift. If the owner prefers A, develop/review its three real indicators before publishing and recompute counts; do not borrow Prophet APEST items automatically.</div>`);
section("discernment","Discernment of Spirits: no generic judgment substitution",`${sourceDefinition(bank.sourceReview.discernmentOfSpirits)}<p><strong>${esc(bank.sourceReview.discernmentOfSpirits.recommendation)}</strong></p><p>Strength Discernment in 07/09/11/14/33 evaluates inconsistency, consequences and practical application. Wisdom in 09/14/33 applies spiritual truth to real situations. Neither establishes whether an influence comes from God, human influence, or spiritual deception. No classification change has been implemented.</p>`);
section("optional","Optional Spiritual Experience & Discernment: 12 + conditional 3, all unscored",`
<p>Healing, Miracles, Tongues, and Interpretation of Tongues remain optional experience/discernment areas, approved in principle. Actual self-report is not verified supernatural causation or an automated score. Humility, accountability, openness, and guidance are context only, never proof. Prophecy is separately conditional as described above. All numeric choices here are stored as unscored discussion responses in this design.</p>
<p><strong>Unscored response:</strong> “${esc(bank.responseModels.specialExperienceLikert.na)}”. No pressure to use a church tradition's language, claim an experience, or disclose publicly.</p>
${table(["ID / gift / binding","Prompt","Role"],bank.stableOptionalPresentationOrder.map(id=>{const q=bank.optionalSpecialExperienceModule.items.find(x=>x.id===id);return [`<strong data-optional-id="${q.id}">${q.id}</strong><br>${esc(q.construct)}<br>${esc(q.module)}`,esc(q.text),esc(q.kind==="context-only"?"Unscored context only; not gift evidence":"Unscored self-report; no verification or proof")];}))}`);
section("evidence","N/A, missingness, completion and evidence rules",list(Object.entries(bank.mappingPolicy).filter(([k])=>!["weights","maxMaps"].includes(k)).map(([k,v])=>`${k}: ${v}`))+`<p>Proposed response anchors remain 1–5: Not at all / A little / Sometimes / Often / Very much like me. Personality remains the named left-to-right preference poles. A value of 1 is an answered observation, not missing. An answered-but-unapproved construct is not automatically publishable. Keep evidence eligibility separate from numeric magnitude and assessment completion.</p><p>Do not port legacy midpoint or zero defaults into this new bank. Current source acceptance of numeric-only gift responses differs from this proposed N/A model; a future adapter would need separate approval. This review changes neither.</p>`);
section("toggles","Gift toggles and future immutable snapshots",list(Object.values(bank.toggleAndSnapshotPolicy))+`
<p>Examples: disabling Administration removes only its maps from 02/04/46, retaining their APEST/Strength uses. Disabling Evangelism keeps shared APEST/Strength items. Disabling Celibacy removes 37–39 because there are no other uses. Disabling Intercession hides 54 but retains 25/27 for Faith. No disabled map can contribute a hidden numerator or denominator. Structural simulation covers all 26 single-gift toggles; it is not end-to-end app verification.</p>`);
section("audits","Every item: alternate explanation, discrimination and cultural/translation audit",`
<p>All ${bank.coreQuestions.length+bank.optionalSpecialExperienceModule.items.length} candidate prompts are covered, including unchanged Personality and optional context. “Editorial pass” never means translation-tested, unbiased, psychometrically discriminating, or free from social desirability. Faith-specific behavior cannot be made universally answerable without losing the construct; N/A is essential.</p>
${[...bank.stablePresentationOrder.map(id=>byId[id]),...bank.optionalSpecialExperienceModule.items].map(q=>`<details><summary>${esc(q.id)} · ${esc(q.text)}</summary>${table(["Audit question","Finding"],Object.entries(q.itemAudit).map(([k,v])=>[esc(k),esc(v)]))}${q.qualityReview?`<h4>Eight quality checks (also recorded for retained behavior items)</h4>${table(["Check","Status","Review"],Object.entries(q.qualityReview).map(([k,v])=>[esc(k),esc(v.status),esc(v.review)]))}`:""}</details>`).join("")}`);
section("boundaries","Preserved areas and actual Serving Pattern calculation",`
<p>No application, database, configuration, assessment flow, or historical record was modified. Youth pathways are unchanged. What Moves Your Heart; What Your Story Has Prepared You For; Your Current Season; Spiritual Health; Interests; Availability; Experience; Languages; Family information; Conversation; and historical/youth assessments are all outside this work. No new body-metaphor questions.</p>
<p><code>artifacts/every-part/src/lib/my-profile-derivation.ts:47–150</code> is the current Serving Pattern numeric calculation: per role, weighted available Personality directional signals normalized by their available weight; then <strong>0.9 × personality signal + 0.1 × (role supporting-strength count / maximum role supporting-strength count, minimum denominator 1)</strong>. Roles without Personality weight are excluded. Runner-up is secondary when the gap ≤0.08; confidence uses ≤0.04 blended, ≤0.12 moderate, otherwise clear (or insufficient when no pair). These are existing code labels, not validated confidence probabilities.</p>
<p>Hands uses Action-right 3 / Focus-left 2 / Pace-right 1; Ears Social-left 2 / Decision-left 3 / Pace-left 1; Shoulders Action-left 3 / Pace-left 2 / Work-right 1; Voice Social-right 3 / Focus-right 1 / Work-right 2; Arms Social-right 2 / Decision-left 2 / Work-right 2; Backbone Planning-right 3 / Focus-left 2 / Pace-left 1. Gifts and APEST do <strong>not</strong> enter that numeric function, though broader narrative synthesis uses them. Preserve actual calculation, not a claim it mathematically integrates all four areas. How a future uncapped strength result supplies the existing selected-strength input is an explicit adapter decision, not silently redesigned here.</p>`);
section("risks","Remaining concerns and approval gates",list(bank.remainingConcerns)+`
<p><strong>Recommendation:</strong> approve content direction only after theological decisions on Prophecy/Discernment and sensitive-gift scope; review the 83-slot repair and six map removals; then cognitive interviews across cultures/languages, timing and missingness pilot, and empirical construct/reliability analysis before score-publication claims. No deployment or taxonomy change is authorized by this report.</p>`);
section("verification","Verification and provenance",`
<p>${esc(bank.validation.interpretation)}</p>${table(["Structural check","Result"],checks.map(c=>[esc(c.name),c.status]))}
<p>HTML is generated from this same final JSON model, and count markers, coverage-table cardinality, and item inventories are checked after generation. A separate report records assertions, exact counts, hashes and conceptual blockers. No workflow, server, or application was started/restarted for this report.</p>
${table(["Baseline / source","SHA-256"],[...bank.provenance.baselineFiles,...bank.provenance.inspectedSourceFiles,bank.provenance.prompt].map(p=>[esc(p.path),`<code>${esc(p.sha256)}</code>`]))}
<p>Reproduce with <code>node reports/build-final-integrated-review.cjs</code>. Outputs only this review HTML, the final bank JSON, and validation JSON. Baseline hashes are checked after writing. Visual rendering is not a psychometric or live-app check.</p>`);
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Every Part — Final Integrated Content Review</title><style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#edf2f4;color:#172c32;font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}header{background:#133d44;color:#fff;padding:46px max(5vw,24px)}header p{max-width:1000px;color:#d5e5e8}h1{font-size:clamp(28px,4vw,44px);line-height:1.13;margin:12px 0}main{max-width:1420px;margin:auto;background:#fff;padding:25px clamp(16px,4vw,58px) 70px}h2{font-size:24px;line-height:1.25;margin-top:0}h3{font-size:18px}h4{font-size:15px}section{padding:32px 0;border-bottom:1px solid #d6e0e2;scroll-margin-top:15px}a{color:#09616c}header a{color:white}nav{display:flex;flex-wrap:wrap;gap:8px 20px;font-size:13px}.callout{padding:18px 22px;background:#fff3d8;border-left:4px solid #bc8124;margin:18px 0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:25px 0}.cards>div{background:#ecf4f4;padding:20px}.cards b{display:block;font-size:25px}.cards span{display:block;font-size:12px}.scroll{overflow:auto;max-width:100%}table{width:100%;border-collapse:collapse;font-size:12px;line-height:1.5;margin:12px 0 22px}td,th{padding:10px;border:1px solid #d6e0e2;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#eaf1f2;color:#163f46}td:first-child{min-width:110px}small{font-size:11px;color:#445f64}hr{border:0;border-top:1px solid #dce5e6;margin:9px 0}details{border:1px solid #d6e0e2;border-radius:5px;margin:10px 0;padding:12px 16px}summary{cursor:pointer;font-weight:600}details[open] summary{margin-bottom:15px}article{padding:15px 0;border-bottom:1px solid #e0e8e9}code{font:12px ui-monospace,monospace;overflow-wrap:anywhere;background:#eff4f4}li{margin:7px 0}.eyebrow{letter-spacing:.16em;font-size:12px;font-weight:700;text-transform:uppercase}@media print{body,main{background:white}header{background:white;color:#172c32;padding:10px}header p{color:#172c32}main{padding:10px;max-width:none}nav{display:none}details{display:block}details>*{display:block!important}table{font-size:9px}section{break-before:auto}h2,h3{break-after:avoid}}
</style></head><body><header><div class="eyebrow">Every Part · Content design · Approval pending</div><h1>Final integrated content review</h1><p>83 core slots, honest evidence boundaries, no live changes. An exhaustive editorial review of the revised question bank—not a validation claim or an implementation.</p><nav>${[["requirements","28 requirements"],["diff","Exact diff"],["redundancy","Removal audits"],["coverage-apest","Coverage"],["bank","Full bank"],["prophecy","Prophecy decision"],["audits","Item audits"],["verification","Verification"]].map(([id,text])=>`<a href="#${id}">${text}</a>`).join("")}</nav></header><main>${sections.join("\n")}</main></body></html>`;
check("HTML core/optional inventories and scenario counts agree exactly with JSON",()=>{
  assert.equal((html.match(/data-core-id=/g)||[]).length,83);
  assert.equal((html.match(/data-optional-id=/g)||[]).length,15);
  assert(html.includes('data-core-count="83"'));assert(html.includes('data-optional-count="15"'));
  for(const c of bank.countScenarios)assert(html.includes(`data-scenario="${c.id}" data-total="${c.total}"`));
  for(const [category,key] of [["APEST","apest"],["Spiritual Gift","gifts"],["Strength","strengths"],["Personality","personality"]]) {
    const block=html.split(`<section id="coverage-${key}">`)[1].split("</section>")[0];
    assert.equal((block.match(/<tr>/g)||[]).length-1,taxonomies[category].length);
    for(const c of bank.coverage.filter(c=>c.category===category)) assert(block.includes(`<td>${esc(c.construct)}</td><td>${c.primary}</td><td>${c.secondary}</td><td>${c.distinct}</td><td>${c.weighted.toFixed(1)}</td>`));
  }
});
const outJson="reports/final-integrated-question-bank.json",outHtml="reports/final-integrated-content-review.html",outValidation="reports/final-integrated-validation.json";
fs.writeFileSync(outJson,JSON.stringify(bank,null,2)+"\n");
fs.writeFileSync(outHtml,html);
check("Both baseline files remain byte-for-byte unchanged",()=>{
  for(const b of originalHashes)assert.equal(hash(fs.readFileSync(b.path)),b.sha256);
});
fs.writeFileSync(outValidation,JSON.stringify({
  status:"Structural assertions passed; substantive approval and field validation still required",
  checks,
  outputs:[outJson,outHtml].map(path=>({path,sha256:hash(fs.readFileSync(path)),bytes:fs.statSync(path).size})),
  counts:{core:83,behavior:62,personality:21,optionalSpecialFour:12,optionalProphecyConditional:3,maxOptional:15,finalFourMapItems:bank.coreQuestions.filter(q=>q.maps.length===4).length,finalMapCount:bank.coreQuestions.reduce((n,q)=>n+q.maps.length,0)},
  diff:{added:bank.baselineDiff.added,removed:bank.baselineDiff.removed,replaced:bank.baselineDiff.replaced,rewritten:bank.baselineDiff.rewritten,mappingChanged:bank.baselineDiff.mappingChanged,mapsRemoved:6,weightPromotions:0},
  coverage:bank.coverage,scenarios:bank.countScenarios,conceptualBlockers:bank.remainingConcerns,baselineHashes:originalHashes,
},null,2)+"\n");
console.log(JSON.stringify({outputs:[outHtml,outJson,outValidation],checks:checks.length,diff:{replacement:bank.baselineDiff.replaced,rewritten:bank.baselineDiff.rewritten.length,mapChanged:bank.baselineDiff.mappingChanged},maps:bank.coreQuestions.reduce((n,q)=>n+q.maps.length,0),fourMap:bank.coreQuestions.filter(q=>q.maps.length===4).length},null,2));