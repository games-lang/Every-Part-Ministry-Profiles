import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRoute, Link } from "wouter";
import { useFieldArray, useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetPublicChurch,
  getGetPublicChurchQueryKey,
  useCreateProfile,
  useGetPublicPersonInvite,
  type AssessmentConfiguration,
  type ProfileInput,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { personalitySummarySentence } from "@/lib/personality-prose";
import { profileSubmissionError } from "@/lib/profile-submission-error";
import { ProfileParts } from "@/components/profile-parts";
import { ProfilePhotoUploader } from "@/components/profile-photo-uploader";

function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function colorForeground(hex: string) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map(
    (start) => Number.parseInt(value.slice(start, start + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.055;
  return whiteContrast >= darkContrast ? "0 0% 100%" : "220 58% 8%";
}

function brandLogoSource(path: string | null | undefined) {
  return path || null;
}

const OPTIONS = {
  passions: [
    "Children",
    "Youth",
    "Young adults",
    "Families",
    "New Christians",
    "People who don't know Jesus",
    "Immigrants/refugees",
    "Multicultural ministry",
    "Missions",
    "People experiencing poverty",
    "Addiction recovery",
    "Grief",
    "Elderly adults",
    "Prayer",
    "Discipleship",
    "Worship",
    "Community outreach",
    "Justice/compassion",
    "Second-generation ministry",
  ],
  interests: [
    "Children",
    "Preschool",
    "Youth",
    "Young adults",
    "Worship",
    "Sound/tech",
    "Hospitality",
    "Greeting",
    "Prayer",
    "Small groups",
    "Discipleship",
    "Outreach",
    "Missions",
    "Communications",
    "Office/admin",
    "Finance",
    "Event planning",
    "Translation",
    "Transportation",
    "Maintenance",
    "Care ministry",
    "Leadership",
  ],
  availability: [
    "Sunday mornings",
    "Sunday evenings",
    "Weekday mornings",
    "Weekday evenings",
    "Saturdays",
    "Flexible/varies",
  ],
} as const;
const SPIRITUAL_GIFTS = [
  [
    "Administration",
    "organizing people, resources, and systems effectively",
    [
      "I help bring order to people, resources, or systems so a shared work can move forward.",
      "People benefit from the way I organize work and create follow-through.",
      "Creating clarity and structure for a shared effort gives me energy.",
      "I look for ways to organize ministry work so others can contribute with clarity and care.",
    ],
  ],
  [
    "Apostleship",
    "pioneering, starting, expanding, and establishing new ministries or works",
    [
      "I help begin, expand, or establish a new work when the path is not yet clear.",
      "I help new ministries or initiatives take root and grow.",
      "I feel drawn to explore faithful next steps in new places or communities.",
      "I listen for where a new ministry effort may need patient beginnings and shared support.",
    ],
  ],
  [
    "Discernment of Spirits",
    "recognizing what is from God, human influence, or spiritual deception",
    [
      "I prayerfully distinguish what may be from God, human influence, or spiritual deception.",
      "My careful listening helps others consider spiritual impressions or concerns wisely.",
      "I pause, pray, and seek wise counsel before naming what I sense.",
      "I value humility and community discernment when considering what may be influencing a ministry situation.",
    ],
  ],
  [
    "Evangelism",
    "communicating the gospel and helping people respond to Jesus",
    [
      "I communicate the gospel or accompany someone taking a step toward Jesus.",
      "People respond positively when I share my faith with care.",
      "I feel drawn to build relationships with people who are exploring Jesus.",
      "I make space for honest questions as I share the hope I have in Jesus.",
    ],
  ],
  [
    "Exhortation / Encouragement",
    "strengthening, motivating, comforting, and challenging others",
    [
      "My words help people feel strengthened, comforted, motivated, or thoughtfully challenged.",
      "People tell me that my encouragement makes a positive difference.",
      "I notice opportunities to speak hope or courage into another person's situation.",
      "I seek to offer timely encouragement that helps others take a faithful next step.",
    ],
  ],
  [
    "Faith",
    "unusual confidence in God’s power, promises, and provision",
    [
      "I experience confidence in God's power, promises, or provision during uncertainty.",
      "My trust in God strengthens others during difficult circumstances.",
      "I continue praying and acting faithfully when outcomes remain unclear.",
      "I try to point a ministry team toward trust in God while remaining open about uncertainty.",
    ],
  ],
  [
    "Giving",
    "generously and joyfully sharing resources to advance God’s work and meet needs",
    [
      "I share time, money, or other resources to meet needs or support God's work.",
      "I see meaningful fruit when I give generously and thoughtfully.",
      "I feel joy and freedom when I look for ways to share resources.",
      "I consider how my resources might quietly support people and ministry needs.",
    ],
  ],
  [
    "Healing",
    "being used by God as an instrument of physical, emotional, or spiritual healing",
    [
      "I offer care or prayer when people experience physical, emotional, or spiritual hurt.",
      "My care or prayer brings comfort or encouragement to people who are hurting.",
      "I feel drawn to be present with people seeking healing while leaving outcomes with God.",
      "I support people seeking healing with compassion, appropriate care, and respect for their circumstances.",
    ],
  ],
  [
    "Helps / Service",
    "meeting practical needs and supporting others so ministry can happen",
    [
      "I notice and meet practical needs that support people or ministry.",
      "People value the practical support I offer.",
      "Behind-the-scenes tasks that help a shared work happen give me energy.",
      "I am willing to take on practical work that allows others to serve more effectively.",
    ],
  ],
  [
    "Hospitality",
    "welcoming people and creating environments where others feel received and cared for",
    [
      "I help create settings where people feel welcomed, received, and cared for.",
      "Guests and others feel included when I welcome them.",
      "I feel drawn to make room for people who may feel new, overlooked, or uncertain.",
      "I pay attention to small ways a ministry environment can feel more welcoming and accessible.",
    ],
  ],
  [
    "Interpretation of Tongues",
    "interpreting a message spoken in tongues",
    [
      "I experience or sense a grace to interpret a message spoken in tongues.",
      "I welcome careful confirmation, accountability, and feedback when discerning this grace.",
      "I approach this practice prayerfully, humbly, and in appropriate community order.",
      "I seek to participate in this practice in ways that honor shared discernment and the wellbeing of the community.",
    ],
  ],
  [
    "Knowledge",
    "understanding and communicating spiritual truth or insight",
    [
      "I understand and communicate spiritual truth or insight that helps someone.",
      "People find my spiritual insight clear and helpful.",
      "I want to keep learning and share insight with humility.",
      "I offer what I am learning in ways that may help others reflect on faith and ministry.",
    ],
  ],
  [
    "Leadership",
    "providing direction, motivating others, and helping a group move toward God-given goals",
    [
      "I provide direction or momentum for a group working toward a shared goal.",
      "People value the way I guide, listen to, and motivate them.",
      "Taking responsibility for helping a group move forward gives me energy.",
      "I seek input and share responsibility when helping a ministry team move toward its goals.",
    ],
  ],
  [
    "Mercy",
    "compassionately caring for people who are hurting, struggling, marginalized, or in need",
    [
      "I stay present with people who are hurting, struggling, marginalized, or in need.",
      "People experience care and dignity through the way I treat them.",
      "I stay compassionate when another person's needs are complex or ongoing.",
      "I look for respectful, practical ways to stand alongside people facing difficult circumstances.",
    ],
  ],
  [
    "Miracles",
    "being used by God in extraordinary demonstrations of His power",
    [
      "I experience or sense God working in an extraordinary way through situations involving me.",
      "I seek wise confirmation and feedback about extraordinary experiences.",
      "I pray expectantly while remaining humble about outcomes.",
      "I share experiences of God's work with humility and openness to wise discernment.",
    ],
  ],
  [
    "Pastoring / Shepherding",
    "caring for, protecting, guiding, and nurturing people spiritually",
    [
      "I care for, guide, protect, or nurture people in their spiritual lives.",
      "People value my ability to listen and walk patiently with them.",
      "Consistent, relational care over time gives me energy.",
      "I make time to notice how people are doing and to offer steady, appropriate support.",
    ],
  ],
  [
    "Prophecy",
    "communicating a message believed to be prompted by God for strengthening, correction, encouragement, or direction",
    [
      "I share messages I believe God has prompted for another person's strengthening, correction, encouragement, or direction.",
      "I seek discernment, confirmation, and feedback when sharing such impressions.",
      "I hold spiritual impressions humbly and submit them to wise discernment.",
      "I consider how a spiritual impression might be shared in a way that serves others with care and accountability.",
    ],
  ],
  [
    "Teaching",
    "explaining and applying biblical truth so others understand and grow",
    [
      "I explain or apply biblical truth in ways that help people understand or grow.",
      "People value the clarity and care of my teaching.",
      "Preparing, learning, and adapting so others can engage Scripture gives me energy.",
      "I invite questions and adapt my approach so people can engage biblical truth together.",
    ],
  ],
  [
    "Tongues",
    "speaking in a language or spiritual utterance given through the Holy Spirit",
    [
      "I experience or sense a grace for speaking in a language or spiritual utterance given through the Holy Spirit.",
      "Pastoral guidance, confirmation, or feedback helps me understand these experiences.",
      "I practice this prayerfully and with care for the gathered community.",
      "I seek to practice this in ways that respect pastoral guidance and strengthen the gathered community.",
    ],
  ],
  [
    "Wisdom",
    "applying spiritual truth appropriately to real situations",
    [
      "I apply spiritual truth thoughtfully to real situations.",
      "People value the timing, care, or practicality of my counsel.",
      "I listen carefully before offering perspective in a complex situation.",
      "I try to offer perspective that is thoughtful, practical, and attentive to the people involved.",
    ],
  ],
  [
    "Craftsmanship",
    "using artistic or practical skill for God’s purposes",
    [
      "I use artistic or practical skill in ways that serve God's purposes or people.",
      "My creative or practical work contributes meaningful value to others.",
      "I offer my craft carefully for a shared ministry need.",
      "I collaborate with others to use creative or practical skills in service of a ministry need.",
    ],
  ],
  [
    "Intercession",
    "persistent, focused prayer for others",
    [
      "I stay in focused prayer for people, needs, or situations.",
      "I follow up with people I have prayed for and notice how God is at work.",
      "I feel drawn to carry other people's needs in persistent prayer.",
      "I bring ministry needs to prayer with perseverance while respecting the privacy of those involved.",
    ],
  ],
  [
    "Missionary / Cross-Cultural Ministry",
    "effectively ministering across cultures and communities",
    [
      "I serve, learn, or build relationships across cultures or communities different from my own.",
      "People experience respect, listening, and adaptability from me across cultural differences.",
      "I want to keep learning from and serving with people across cultural differences.",
      "I seek guidance from local people and partners as I serve across cultural differences.",
    ],
  ],
  [
    "Music / Worship",
    "using musical ability to lead and encourage worship",
    [
      "I use musical ability to lead or encourage worship.",
      "My musical contribution helps the worshiping community participate.",
      "Preparing and collaborating so music serves worship gives me energy.",
      "I listen and collaborate so musical contributions support the worshiping community rather than draw attention to me.",
    ],
  ],
  [
    "Celibacy",
    "a particular grace for remaining unmarried for undivided devotion to ministry",
    [
      "My singleness connects meaningfully with my devotion, relationships, and service.",
      "I seek wise feedback and support as I discern this part of my life.",
      "I presently experience peace or freedom in remaining unmarried for undivided devotion to ministry.",
      "I consider how my present season of life can be lived with healthy relationships and faithful service.",
    ],
  ],
  [
    "Voluntary Poverty",
    "willingly living with less in order to serve God and others",
    [
      "I willingly choose to live with less in order to serve God or others.",
      "I notice meaningful fruit or challenges when I simplify or share.",
      "I feel drawn to consider a simpler way of life for service and generosity.",
      "I reflect on how simpler choices might create room to serve others with generosity and wisdom.",
    ],
  ],
] as const;
const RESPONSE_OPTIONS = [
  "Not at all",
  "A little",
  "Sometimes",
  "Often",
  "Very much",
] as const;
type SpiritualGiftQuestion = {
  gift: string;
  tag?: string;
  meaning: string;
  questionIndex: number;
  prompt: string;
};
function shuffleQuestions(questions: SpiritualGiftQuestion[]) {
  const result: SpiritualGiftQuestion[] = [];
  const rounds = [
    ...new Set(questions.map((question) => question.questionIndex)),
  ].sort();
  for (const round of rounds) {
    const shuffledRound = questions.filter(
      (question) => question.questionIndex === round,
    );
    for (let index = shuffledRound.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledRound[index], shuffledRound[swapIndex]] = [
        shuffledRound[swapIndex],
        shuffledRound[index],
      ];
    }
    const previousGift = result.at(-1)?.gift;
    if (previousGift && shuffledRound[0]?.gift === previousGift) {
      const differentGiftIndex = shuffledRound.findIndex(
        (question) => question.gift !== previousGift,
      );
      if (differentGiftIndex > 0) {
        [shuffledRound[0], shuffledRound[differentGiftIndex]] = [
          shuffledRound[differentGiftIndex],
          shuffledRound[0],
        ];
      }
    }
    result.push(...shuffledRound);
  }
  return result;
}
const MINISTRY_APPROACHES = [
  {
    label: "Starting and building new ministry",
    tag: "Apostle",
    key: "builder",
    prompts: [
      "I enjoy imagining new possibilities and helping turn them into something others can join.",
      "I am energized by helping a new ministry take shape when no clear path exists.",
      "I am comfortable taking a first step and helping others move from an idea toward action.",
      "I look for practical ways to help a new idea become a shared effort.",
    ],
  },
  {
    label: "Noticing what needs attention",
    tag: "Prophet",
    key: "insight",
    prompts: [
      "I notice patterns, tensions, or needs that others may be overlooking.",
      "I am willing to name difficult truths when doing so can help people or a ministry move toward health.",
      "I pay attention to whether a ministry's direction reflects its values and purpose.",
      "I take time to consider what may need attention before a small concern becomes a larger one.",
    ],
  },
  {
    label: "Connecting people with faith",
    tag: "Evangelist",
    key: "connector",
    prompts: [
      "I naturally build relationships with people who are curious about faith or far from church.",
      "I enjoy explaining the good news in a way that connects with someone's story.",
      "I look for natural opportunities to welcome people into meaningful conversations about faith.",
      "I make space for people to ask honest questions as they explore faith.",
    ],
  },
  {
    label: "Caring for people over time",
    tag: "Shepherd",
    key: "caregiver",
    prompts: [
      "People often come to me for patient care, encouragement, and guidance over time.",
      "I feel responsible for helping people feel known, supported, and connected.",
      "I stay engaged with people through seasons of growth, difficulty, and change.",
      "I notice when someone may need steady support and follow up with care.",
    ],
  },
  {
    label: "Making ideas clear",
    tag: "Teacher",
    key: "teacher",
    prompts: [
      "I enjoy making complex ideas clear and helping people understand what they believe.",
      "I like studying, organizing, and communicating ideas so others can grow.",
      "I adjust the way I explain something when people need a different path to understanding.",
      "I invite questions and use them to help people engage more deeply with an idea.",
    ],
  },
] as const;
const MINISTRY_QUESTIONS = MINISTRY_APPROACHES.flatMap(({ key, tag, prompts }) =>
  prompts.map((prompt, questionIndex) => ({
    key,
    tag,
    questionIndex,
    prompt,
  })),
);
const STRENGTH_APPROACHES = [
  {
    label: "Relational connection",
    key: "relationalConnection",
    prompts: [
      "I quickly notice what helps people feel seen and included.",
      "I naturally build trust across different kinds of people.",
      "I remember personal details that help relationships grow.",
    ],
  },
  {
    label: "Encouragement",
    key: "encouragement",
    prompts: [
      "I notice progress or potential in people, even when they cannot see it yet.",
      "I help people regain courage when they feel discouraged.",
      "My words often help others take a hopeful next step.",
    ],
  },
  {
    label: "Teaching and explaining",
    key: "teachingExplaining",
    prompts: [
      "I enjoy breaking complex ideas into clear, understandable parts.",
      "I check whether people are following and adjust how I explain something.",
      "I like helping people connect what they learn with everyday life.",
    ],
  },
  {
    label: "Listening",
    key: "listening",
    prompts: [
      "I give people my full attention before deciding what to say.",
      "People often feel safe sharing honestly with me.",
      "I can stay present with a story without rushing to fix it.",
    ],
  },
  {
    label: "Leadership and initiative",
    key: "leadershipInitiative",
    prompts: [
      "I notice a needed next step and am willing to help begin it.",
      "I take responsibility when a group needs direction or momentum.",
      "I am comfortable making a thoughtful decision when no option is perfect.",
    ],
  },
  {
    label: "Organizing",
    key: "organizing",
    prompts: [
      "I create structure that helps people know what needs to happen next.",
      "I enjoy coordinating details, schedules, people, or resources.",
      "I can make a complicated project feel more manageable.",
    ],
  },
  {
    label: "Creative expression",
    key: "creativeExpression",
    prompts: [
      "I see fresh ways to communicate an idea or invite participation.",
      "I enjoy turning imagination into something people can experience.",
      "I bring originality to projects, conversations, or ministry environments.",
    ],
  },
  {
    label: "Problem-solving",
    key: "problemSolving",
    prompts: [
      "I look for practical options when a situation feels stuck.",
      "I enjoy understanding why something is not working and finding a better approach.",
      "I stay curious and resourceful when circumstances change.",
    ],
  },
  {
    label: "Practical hands-on work",
    key: "practicalHandsOn",
    prompts: [
      "I learn well by working with real materials, tools, or physical tasks.",
      "I notice practical needs and can often figure out how to meet them.",
      "I take satisfaction in making something useful, functional, or well-built.",
    ],
  },
  {
    label: "Hospitality",
    key: "hospitality",
    prompts: [
      "I notice what helps people feel comfortable in an unfamiliar setting.",
      "I naturally make room for people who might otherwise be overlooked.",
      "I enjoy creating welcoming experiences through details, food, space, or conversation.",
    ],
  },
  {
    label: "Compassion and care",
    key: "compassionCare",
    prompts: [
      "I pay attention to how people are doing beneath the surface.",
      "I am willing to stay close when someone is hurting or needs ongoing support.",
      "I look for ways to protect another person's dignity while offering practical care.",
    ],
  },
  {
    label: "Communication and storytelling",
    key: "communicationStorytelling",
    prompts: [
      "I can express an idea in a way that people remember.",
      "I use examples, stories, or images to help people connect with a message.",
      "I enjoy finding the right words for different people and situations.",
    ],
  },
  {
    label: "Discernment",
    key: "discernment",
    prompts: [
      "I notice important differences between what is being said and what may be happening underneath.",
      "I weigh information carefully before forming a conclusion.",
      "I can sense when a plan, message, or situation needs a closer look.",
    ],
  },
  {
    label: "Follow-through",
    key: "followThrough",
    prompts: [
      "I keep track of commitments and make sure important details do not get lost.",
      "People can depend on me to finish what I have agreed to do.",
      "I find satisfaction in bringing a project or responsibility to completion.",
    ],
  },
  {
    label: "Adaptability",
    key: "adaptability",
    prompts: [
      "I can adjust my approach when people, plans, or circumstances change.",
      "I stay useful even when I have to work with an unfamiliar process or group.",
      "I can hold a plan lightly while still moving toward the larger goal.",
    ],
  },
  {
    label: "Mentoring and development",
    key: "mentoringDevelopment",
    prompts: [
      "I enjoy helping people recognize their next area of growth.",
      "I give thoughtful feedback that helps others build confidence and skill.",
      "I am willing to invest consistently in someone's development over time.",
    ],
  },
  {
    label: "Strategic thinking",
    key: "strategicThinking",
    prompts: [
      "I naturally connect present decisions with longer-term goals.",
      "I can identify which priorities will make the greatest difference.",
      "I enjoy seeing how people, resources, and ideas can work together toward a shared purpose.",
    ],
  },
  {
    label: "Advocacy and justice",
    key: "advocacyJustice",
    prompts: [
      "I notice when people are being overlooked, excluded, or treated unfairly.",
      "I am willing to speak up when someone needs support or protection.",
      "I look for constructive ways to make a group or community more equitable and welcoming.",
    ],
  },
] as const;
const STRENGTH_QUESTIONS = STRENGTH_APPROACHES.flatMap(({ key, prompts }) =>
  prompts.map((prompt, questionIndex) => ({ key, questionIndex, prompt })),
);
const PERSONALITY_DIMENSIONS = [
  {
    label: "Social Energy",
    key: "socialEnergy",
    left: "Reflective",
    right: "Interactive",
    description: "How you tend to gain and spend social energy.",
    leftExplanation:
      "You tend to process internally and may recharge through quieter environments, deeper conversations, or time alone.",
    rightExplanation:
      "You tend to process through interaction and may gain energy through conversation, activity, and being around others.",
    leftSummary: "thoughtful and reflective",
    rightSummary: "energized by interaction",
    ministry: "how you connect with people and communicate in groups",
  },
  {
    label: "Decision Lens",
    key: "decisionLens",
    left: "Relational",
    right: "Principled",
    description: "What you tend to consider first when making decisions.",
    leftExplanation:
      "You naturally consider people, relationships, compassion, emotional impact, and how others will be affected.",
    rightExplanation:
      "You naturally consider logic, consistency, fairness, standards, facts, and what solution makes the most sense.",
    leftSummary: "relationship-aware",
    rightSummary: "principled and consistent",
    ministry:
      "how you weigh people, compassion, fairness, and consistency when making decisions",
  },
  {
    label: "Planning Style",
    key: "planningStyle",
    left: "Adaptive",
    right: "Settled",
    description: "How you tend to approach plans and decisions.",
    leftExplanation:
      "You may enjoy flexibility, keeping options open, adjusting as you go, and responding to changing circumstances.",
    rightExplanation:
      "You may prefer clear expectations, schedules, deadlines, decisions, and knowing what comes next.",
    leftSummary: "flexible and adaptive",
    rightSummary: "prepared and settled",
    ministry:
      "how you respond to change and how much structure helps you serve well",
  },
  {
    label: "Focus Style",
    key: "focusStyle",
    left: "Detail",
    right: "Big Picture",
    description: "What you naturally tend to notice.",
    leftExplanation:
      "You tend to notice practical needs, specific information, logistics, steps, and what needs attention right now.",
    rightExplanation:
      "You tend to notice patterns, possibilities, future direction, ideas, connections, and what something could become.",
    leftSummary: "attentive to detail",
    rightSummary: "big-picture oriented",
    ministry:
      "whether you naturally begin with practical details or broader direction",
  },
  {
    label: "Action Style",
    key: "actionStyle",
    left: "Support",
    right: "Initiate",
    description: "How you tend to respond when work needs to be done.",
    leftExplanation:
      "You may naturally strengthen, improve, assist, maintain, and help existing efforts succeed.",
    rightExplanation:
      "You may naturally start things, suggest new approaches, create momentum, and move ideas into action.",
    leftSummary: "supportive and strengthening",
    rightSummary: "initiative-taking",
    ministry:
      "whether you are most energized by strengthening existing work or starting something new",
  },
  {
    label: "Pace Preference",
    key: "pacePreference",
    left: "Steady",
    right: "Dynamic",
    description: "What type of pace tends to feel most natural.",
    leftExplanation:
      "You may thrive with consistency, predictable rhythms, focused responsibilities, and sustainable routines.",
    rightExplanation:
      "You may enjoy variety, change, multiple responsibilities, urgency, and fast-moving environments.",
    leftSummary: "steady and sustainable",
    rightSummary: "dynamic and responsive",
    ministry: "what rhythms, pace, and level of change help you remain engaged",
  },
  {
    label: "Work Style",
    key: "workStyle",
    left: "Independent",
    right: "Collaborative",
    description: "How you tend to work most naturally.",
    leftExplanation:
      "You may enjoy autonomy, focused responsibility, personal ownership, and being trusted to complete a task.",
    rightExplanation:
      "You may enjoy shared responsibility, brainstorming, interaction, feedback, and accomplishing things together.",
    leftSummary: "self-directed",
    rightSummary: "collaborative",
    ministry:
      "how you handle responsibility, feedback, teamwork, and shared ownership",
  },
] as {
  label: string;
  key: string;
  left: string;
  right: string;
  description: string;
  leftExplanation: string;
  rightExplanation: string;
  leftSummary: string;
  rightSummary: string;
  ministry: string;
}[];
const PERSONALITY_QUESTIONS = [
  [
    "socialEnergy",
    [
      "After a full week, I feel most restored by how much quiet or interaction I choose.",
      "In a new group, I tend to process my experience privately or through conversation.",
      "When I need to work through an idea, I am more likely to think first or talk it through.",
    ],
  ],
  [
    "decisionLens",
    [
      "When choosing between good options, I first consider people and impact or principles and consistency.",
      "A decision feels sound to me when it honors relationships or makes the most sense by a clear standard.",
      "When a decision affects people differently, I first weigh compassion or fairness and consistency.",
    ],
  ],
  [
    "planningStyle",
    [
      "When beginning a project, I prefer to keep options open or settle the plan early.",
      "If circumstances change, I naturally adjust as I go or return to a clear plan.",
      "I feel most comfortable when the next steps can remain flexible or are already decided.",
    ],
  ],
  [
    "focusStyle",
    [
      "When looking at a situation, I first notice immediate details or broader patterns.",
      "I am most likely to ask what needs attention now or what this could become.",
      "I naturally contribute by clarifying practical steps or connecting ideas and possibilities.",
    ],
  ],
  [
    "actionStyle",
    [
      "When a team already has momentum, I am most energized by strengthening the work or starting a new direction.",
      "When work needs to begin, I am more likely to support an existing effort or create the first movement.",
      "I feel most useful when I improve what is already working or turn an idea into action.",
    ],
  ],
  [
    "pacePreference",
    [
      "My ideal ministry rhythm includes consistency and focus or variety and change.",
      "When several needs appear at once, I prefer a sustainable pace or a fast-moving response.",
      "I sustain my best work through predictable rhythms or a changing mix of responsibilities.",
    ],
  ],
  [
    "workStyle",
    [
      "I do my best work with personal ownership and autonomy or shared responsibility and interaction.",
      "When developing an idea, I prefer focused time alone or brainstorming with others.",
      "Responsibility feels healthiest when I am trusted to own a task or have feedback and shared ownership.",
    ],
  ],
] as const;
const PERSONALITY_QUESTIONS_FLAT = PERSONALITY_QUESTIONS.flatMap(
  ([key, prompts]) =>
    prompts.map((prompt, questionIndex) => ({ key, prompt, questionIndex })),
);
const personalityResponseOptions = (left: string, right: string) => [
  `Strongly ${left}`,
  `Slightly ${left}`,
  "Balanced",
  `Slightly ${right}`,
  `Strongly ${right}`,
];
function personalityResults(
  responses: Record<string, number>,
  dimensions = PERSONALITY_DIMENSIONS,
) {
  return dimensions.map((dimension) => {
    const scores = PERSONALITY_QUESTIONS_FLAT.filter(
      (question) => question.key === dimension.key,
    ).map(
      (question) =>
        responses[`${dimension.key}-${question.questionIndex}`] ?? 3,
    );
    const average =
      scores.reduce((total, score) => total + score, 0) / scores.length;
    const rightPercentage = Math.round(((average - 1) / 4) * 100);
    const leftPercentage = 100 - rightPercentage;
    const dominant =
      leftPercentage === rightPercentage
        ? "balanced"
        : leftPercentage > rightPercentage
          ? "left"
          : "right";
    const dominantPercentage = Math.max(leftPercentage, rightPercentage);
    const tendency =
      dominant === "balanced" || dominantPercentage <= 55
        ? "Balanced"
        : dominantPercentage <= 65
          ? "Slight tendency"
          : dominantPercentage <= 79
            ? "Moderate tendency"
            : dominantPercentage <= 91
              ? "Strong tendency"
              : "Very strong tendency";
    return {
      ...dimension,
      leftPercentage,
      rightPercentage,
      dominant,
      tendency,
      explanation:
        dominant === "left"
          ? dimension.leftExplanation
          : dominant === "right"
            ? dimension.rightExplanation
            : `You draw from both ${dimension.left.toLowerCase()} and ${dimension.right.toLowerCase()} approaches, adapting to what the situation requires.`,
    };
  });
}
function personalitySummary(results: ReturnType<typeof personalityResults>) {
  const descriptors = results
    .filter((result) => result.dominant !== "balanced")
    .sort(
      (a, b) =>
        Math.max(b.leftPercentage, b.rightPercentage) -
        Math.max(a.leftPercentage, a.rightPercentage),
    )
    .slice(0, 3)
    .map((result) =>
      result.dominant === "left" ? result.leftSummary : result.rightSummary,
    );
  return personalitySummarySentence(
    descriptors,
    results.filter((result) => result.dominant !== "balanced").slice(0, 2).map((result) => result.ministry),
  );
}
function personalityMinistryConnection(
  results: ReturnType<typeof personalityResults>,
) {
  const tendencies = results
    .filter((result) => result.dominant !== "balanced")
    .slice(0, 3)
    .map((result) =>
      result.dominant === "left" ? result.leftSummary : result.rightSummary,
    );
  return tendencies.length
    ? `In ministry, your ${tendencies.join(", ")} tendencies may influence how you interact with people, communicate, respond to change, make decisions, and handle responsibility. You may feel most energized in environments that fit your natural rhythms while also leaving room for God to stretch you.`
    : "In ministry, your balanced tendencies may help you adapt across different people, teams, rhythms, and responsibilities.";
}
const choice = z.string();
const assessmentSchema = z.object({
  basicInformation: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    preferredContact: choice,
    familySituation: choice,
    transportation: choice,
  }),
  churchConnection: z.object({
    attendanceLength: choice,
    connectionLevel: z.coerce.number(),
    followingJesusLength: choice,
    servedBefore: z.boolean(),
    previousService: z.string(),
  }),
  passions: z.array(z.string()),
  interests: z.array(z.string()),
  servingFrequency: choice,
  availability: z.array(z.string()),
  languageEntries: z.array(
    z.object({
      language: z.string(),
      proficiency: z.string(),
    }),
  ),
  churchDetails: z.object({
    membership: z.string(),
    service: z.string(),
    previousInvolvement: z.string(),
  }),
  spiritualGifts: z.object({
    responses: z.record(
      z.string(),
      z
        .array(
          z.object({
            prompt: z.string(),
            response: z.number().int().min(1).max(5),
          }),
        )
        .min(1)
        .max(4),
    ),
  }),
  ministryResponses: z.record(z.string(), z.number()),
  personalityResponses: z.record(z.string(), z.number()),
  strengthResponses: z.record(z.string(), z.number()),
  strengthNotes: z.string(),
  occupation: z.string(),
  skills: z.object({
    education: z.string(),
    certifications: z.string(),
    skills: z.string(),
    experience: z.string(),
    uniqueSkills: z.string(),
  }),
  lifeSelected: z.array(z.string()),
  lifeNotes: z.string(),
  availabilityDetails: z.object({
    seasonal: z.string(),
    specialEvents: z.string(),
    retreats: z.string(),
    missionTrips: z.string(),
    projects: z.string(),
    commitment: z.string(),
    responsibility: z.string(),
    durationTheyWillTry: z.string(),
    capacityThisSeason: z.string(),
    currentlyServing: z.string(),
    alreadyAsked: z.string(),
    servingLoadCount: z.string(),
    servingLoadFeel: z.string(),
  }),
  spiritualHealth: z.object({
    prayer: z.string(),
    scripture: z.string(),
    worship: z.string(),
    relationships: z.string(),
    community: z.string(),
    rest: z.string(),
    motivation: z.string(),
    wellbeing: z.string(),
    connection: z.string(),
  }),
  preferences: z.object({
    setting: z.string(),
    role: z.string(),
    routine: z.string(),
    team: z.string(),
    work: z.string(),
    rhythm: z.string(),
  }),
});
type Values = z.infer<typeof assessmentSchema>;
type PublicAssessmentConfiguration = AssessmentConfiguration;
type AssessmentRenderContext = {
  configuration: PublicAssessmentConfiguration;
  step: string;
};
const AssessmentConfigurationContext = createContext<
  AssessmentRenderContext | undefined
>(undefined);
function fieldIsEnabled(
  name: string,
  context: AssessmentRenderContext | undefined,
) {
  const configuration = context?.configuration;
  const aboutYouEnabled = configuration?.sections.aboutYou ?? true;
  const enabled = (key: keyof PublicAssessmentConfiguration["subsections"]) =>
    configuration?.subsections[key] ?? true;
  if (
    [
      "basicInformation.firstName",
      "basicInformation.lastName",
      "basicInformation.email",
    ].includes(name)
  )
    return context?.step === "aboutYou";
  if (name === "basicInformation.phone")
    return (
      context?.step === "aboutYou" &&
      aboutYouEnabled &&
      enabled("aboutYou.personalInformation") &&
      enabled("aboutYou.phone")
    );
  const aboutYouFieldByName = {
    "basicInformation.preferredContact": "aboutYou.preferredContact",
    "basicInformation.familySituation": "aboutYou.familySituation",
    "basicInformation.transportation": "aboutYou.transportation",
    languageEntries: "aboutYou.languages",
  } as const;
  const aboutYouField =
    aboutYouFieldByName[name as keyof typeof aboutYouFieldByName];
  if (aboutYouField)
    return (
      context?.step === "aboutYou" &&
      aboutYouEnabled &&
      enabled("aboutYou.personalInformation") &&
      enabled(aboutYouField)
    );
  if (name === "occupation" || name.startsWith("skills."))
    return (
      context?.step === "skillsExperience" &&
      enabled("aboutYou.skillsExperience")
    );
  if (name === "lifeSelected" || name === "lifeNotes")
    return (
      context?.step === "skillsExperience" &&
      enabled("aboutYou.lifeExperiences")
    );
  if (name === "passions")
    return (
      context?.step === "passionsInterests" &&
      enabled("passionsInterests.passions")
    );
  if (name === "interests")
    return (
      context?.step === "passionsInterests" &&
      enabled("passionsInterests.ministryInterests")
    );
  if (name.startsWith("preferences."))
    return (
      context?.step === "personalityStrengths" &&
      enabled("personalityStrengths.ministryPreferences")
    );
  if (name.startsWith("spiritualHealth."))
    return (
      context?.step === "spiritualHealth" &&
      enabled(
        `spiritualHealth.${name.split(".")[1]}` as keyof PublicAssessmentConfiguration["subsections"],
      )
    );
  if (name.startsWith("churchConnection.") || name.startsWith("churchDetails."))
    return (
      context?.step === "connectionAvailability" &&
      enabled("connectionAvailability.churchConnection")
    );
  if (
    name === "servingFrequency" ||
    name === "availability" ||
    name.startsWith("availabilityDetails.")
  )
    return (
      context?.step === "connectionAvailability" &&
      enabled("connectionAvailability.availability")
    );
  return true;
}
const defaultValues: Values = {
  basicInformation: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: "email",
    familySituation: "",
    transportation: "",
  },
  churchConnection: {
    attendanceLength: "",
    connectionLevel: 3,
    followingJesusLength: "",
    servedBefore: false,
    previousService: "",
  },
  passions: [],
  interests: [],
  servingFrequency: "",
  availability: [],
  languageEntries: [{ language: "", proficiency: "" }],
  churchDetails: { membership: "", service: "", previousInvolvement: "" },
  spiritualGifts: {
    responses: Object.fromEntries(
      SPIRITUAL_GIFTS.map(([gift, , prompts]) => [
        gift,
        prompts.slice(0, 3).map((prompt) => ({ prompt, response: 0 })),
      ]),
    ),
  },
  ministryResponses: Object.fromEntries(
    MINISTRY_QUESTIONS.filter(({ questionIndex }) => questionIndex < 3).map(
      ({ key, questionIndex }) => [
        `${key}-${questionIndex}`,
        0,
      ],
    ),
  ),
  strengthResponses: Object.fromEntries(
    STRENGTH_QUESTIONS.map(({ key, questionIndex }) => [
      `${key}-${questionIndex}`,
      0,
    ]),
  ),
  strengthNotes: "",
  personalityResponses: Object.fromEntries(
    PERSONALITY_QUESTIONS_FLAT.map(({ key, questionIndex }) => [
      `${key}-${questionIndex}`,
      0,
    ]),
  ),
  occupation: "",
  skills: {
    education: "",
    certifications: "",
    skills: "",
    experience: "",
    uniqueSkills: "",
  },
  lifeSelected: [],
  lifeNotes: "",
  availabilityDetails: {
    seasonal: "",
    specialEvents: "",
    retreats: "",
    missionTrips: "",
    projects: "",
    commitment: "",
    responsibility: "",
    durationTheyWillTry: "",
    capacityThisSeason: "",
    currentlyServing: "",
    alreadyAsked: "",
    servingLoadCount: "",
    servingLoadFeel: "",
  },
  spiritualHealth: {
    prayer: "",
    scripture: "",
    worship: "",
    relationships: "",
    community: "",
    rest: "",
    motivation: "",
    wellbeing: "",
    connection: "",
  },
  preferences: {
    setting: "",
    role: "",
    routine: "",
    team: "",
    work: "",
    rhythm: "",
  },
};
type FormProps = { form: ReturnType<typeof useForm<Values>> };
function TextField({
  form,
  name,
  label,
  description,
  multiline = false,
}: FormProps & {
  name: Path<Values>;
  label: string;
  description?: string;
  multiline?: boolean;
}) {
  const context = useContext(AssessmentConfigurationContext);
  if (!fieldIsEnabled(name, context)) return null;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            {multiline ? (
              <Textarea
                name={field.name}
                value={String(field.value ?? "")}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                rows={3}
              />
            ) : (
              <Input
                name={field.name}
                value={String(field.value ?? "")}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
function SelectField({
  form,
  name,
  label,
  options,
  description,
}: FormProps & {
  name: Path<Values>;
  label: string;
  options: readonly string[];
  description?: string;
}) {
  const context = useContext(AssessmentConfigurationContext);
  if (!fieldIsEnabled(name, context)) return null;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <Select value={field.value as string} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
function MultiSelect({
  form,
  name,
  options,
  limit,
}: {
  form: FormProps["form"];
  name: "passions" | "interests" | "lifeSelected" | "availability";
  options: readonly string[];
  limit?: number;
}) {
  const context = useContext(AssessmentConfigurationContext);
  if (!fieldIsEnabled(name, context)) return null;
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="grid sm:grid-cols-2 gap-2">
            {options.map((option) => {
              const selected = field.value.includes(option);
              const disabled =
                !selected && Boolean(limit && field.value.length >= limit);
              return (
                <label
                  key={option}
                  className={`flex gap-3 rounded-lg border p-3 text-sm ${disabled ? "opacity-50" : "cursor-pointer hover:bg-muted/40"}`}
                >
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? [...field.value, option]
                          : field.value.filter((value) => value !== option),
                      )
                    }
                  />
                  {option}
                </label>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
function Heading({
  children,
  description,
  configKey,
}: {
  children: React.ReactNode;
  description?: string;
  configKey?: keyof AssessmentConfiguration["subsections"];
}) {
  const context = useContext(AssessmentConfigurationContext);
  const title = typeof children === "string" ? children : "";
  const visible = configKey
    ? (context?.configuration.subsections[configKey] ?? true)
    : title === "About You"
      ? context?.step === "aboutYou"
      : title === "What You Bring" || title === "Skills & Experience"
        ? context?.step === "skillsExperience" &&
          (context.configuration.subsections["aboutYou.skillsExperience"] ??
            true)
        : title === "Experiences That Have Shaped You" ||
            title === "Life Experiences"
          ? context?.step === "skillsExperience" &&
            (context.configuration.subsections["aboutYou.lifeExperiences"] ??
              true)
          : title === "Who and where you are drawn toward (Passions)"
            ? (context?.configuration.subsections[
                "passionsInterests.passions"
              ] ?? true)
            : title === "Ministry Interests"
              ? (context?.configuration.subsections[
                  "passionsInterests.ministryInterests"
                ] ?? true)
              : title === "Ministry Preferences & Environment"
                ? (context?.configuration.subsections[
                    "personalityStrengths.ministryPreferences"
                  ] ?? true)
                : title === "How you are connected"
                  ? (context?.configuration.subsections[
                      "connectionAvailability.churchConnection"
                    ] ?? true)
                  : title === "Current availability and serving"
                    ? (context?.configuration.subsections[
                        "connectionAvailability.availability"
                      ] ?? true)
                    : true;
  return visible ? (
    <div>
      <h3 className="font-serif text-xl font-medium">{children}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  ) : null;
}
function PersonalityResultsView({
  results,
}: {
  results: ReturnType<typeof personalityResults>;
}) {
  return (
    <div className="space-y-6 rounded-xl border bg-muted/20 p-5">
      <div>
        <h4 className="font-serif text-lg font-medium">
          How You Tend to Operate
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          These percentages describe tendencies, not a fixed personality type.
        </p>
      </div>
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.key} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <h5 className="font-medium">{result.label}</h5>
              <span className="text-xs text-muted-foreground">
                {result.tendency}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs text-muted-foreground mt-3">
              <span>
                {result.left} — {result.leftPercentage}%
              </span>
              <span className="text-right">
                {result.right} — {result.rightPercentage}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${result.rightPercentage}%` }}
              />
            </div>
            <p className="text-sm leading-6 mt-3">{result.explanation}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h4 className="font-serif text-lg font-medium">
          Your Personality at a Glance
        </h4>
        <p className="text-sm leading-6">{personalitySummary(results)}</p>
      </div>
      <div className="space-y-2">
        <h4 className="font-serif text-lg font-medium">
          What This May Mean in Ministry
        </h4>
        <p className="text-sm leading-6">
          {personalityMinistryConnection(results)}
        </p>
        <p className="text-sm text-muted-foreground leading-6">
          Personality helps describe how you tend to operate, not what God can
          or cannot call you to do. God often uses both our natural strengths
          and the areas where He is stretching us.
        </p>
      </div>
    </div>
  );
}

export default function Assessment() {
  const [, params] = useRoute("/profile/:slug/adult");
  const slug = params?.slug ?? "";

  const searchParams = new URLSearchParams(window.location.search);
  const ageQuery = searchParams.get("age");
  const age = ageQuery ? Number(ageQuery) : NaN;
  const birthdate = searchParams.get("birthdate") || undefined;
  const inviteToken = searchParams.get("invite");

  const {
    data: church,
    isLoading,
    error: churchError,
  } = useGetPublicChurch(slug, {
    query: {
      enabled: Boolean(slug),
      queryKey: getGetPublicChurchQueryKey(slug),
    },
  });
  const createProfile = useCreateProfile();
  const { data: invitedPerson } = useGetPublicPersonInvite(inviteToken ?? "", {
    query: {
      enabled: Boolean(inviteToken),
      queryKey: [`/api/people/invites/${inviteToken ?? ""}`],
    },
  });
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [reflectionValidationError, setReflectionValidationError] =
    useState("");
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  if (!age || isNaN(age)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 ep-landing">
        <Card className="w-full max-w-md border-border/60 shadow-lg text-center landing-reveal">
          <CardContent className="p-8">
            <h2 className="text-xl font-serif font-medium mb-3">Age Required</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We need to know your age to ensure we provide the right ministry profile.
            </p>
            <Button asChild variant="default" className="w-full">
              <Link href={`/profile/${slug}`}>
                Return to start
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const setStep = (updater: number | ((current: number) => number)) =>
    setStepIndex((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next < 0) {
        setStarted(false);
        return 0;
      }
      return next;
    });
  const giftGroupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const submissionStarted = useRef(false);
  const initializedGiftConfig = useRef<string | null>(null);
  const form = useForm<Values>({ defaultValues });
  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({
    control: form.control,
    name: "languageEntries",
  });
  const invitationApplied = useRef(false);
  useEffect(() => {
    if (!invitedPerson || invitationApplied.current) return;
    invitationApplied.current = true;
    form.setValue("basicInformation.firstName", invitedPerson.firstName);
    form.setValue("basicInformation.lastName", invitedPerson.lastName);
    form.setValue("basicInformation.email", invitedPerson.email ?? "");
    form.setValue("basicInformation.phone", invitedPerson.phone ?? "");
  }, [form, invitedPerson]);
  const configuration = church?.assessmentConfiguration;
  const spiritualGiftsLabel =
    church?.ministryCustomization.spiritualGiftsLabel ?? "Spiritual Gifts";
  const ministryInterestsLabel =
    church?.ministryCustomization.ministryInterestsLabel ??
    "Ministry Interests";
  const passionOptions = configuration?.passions ?? OPTIONS.passions;
  const ministryInterestOptions =
    configuration?.ministryInterests ?? OPTIONS.interests;
  const sectionEnabled = (
    section: keyof NonNullable<typeof configuration>["sections"],
  ) => configuration?.sections[section] ?? true;
  const subsectionEnabled = (
    key: keyof NonNullable<typeof configuration>["subsections"],
  ) => configuration?.subsections[key] ?? true;
  const hasEnabledSubsections = (section: string) =>
    configuration
      ? Object.entries(configuration.subsections).some(
          ([key, value]) => key.startsWith(`${section}.`) && value,
        )
      : true;
  const optionalAboutYouPanelEnabled =
    sectionEnabled("aboutYou") &&
    subsectionEnabled("aboutYou.personalInformation") &&
    (subsectionEnabled("aboutYou.familySituation") ||
      subsectionEnabled("aboutYou.transportation") ||
      subsectionEnabled("aboutYou.languages") ||
      subsectionEnabled("aboutYou.profilePhoto"));
  const activeSpiritualGifts = SPIRITUAL_GIFTS.filter(
    ([gift]) => church?.enabledSpiritualGifts?.includes(gift) ?? true,
  );
  const stepKeys = [
    "aboutYou",
    ...(sectionEnabled("aboutYou") &&
    (subsectionEnabled("aboutYou.skillsExperience") ||
      subsectionEnabled("aboutYou.lifeExperiences"))
      ? ["skillsExperience"]
      : []),
    ...(
      [
        "apest",
        "spiritualGifts",
        "passionsInterests",
        "naturalStrengths",
        "personalityStrengths",
        "spiritualHealth",
        "connectionAvailability",
      ] as const
    ).filter(
      (section) =>
        sectionEnabled(section) &&
        (section === "spiritualGifts"
          ? activeSpiritualGifts.length > 0
          : hasEnabledSubsections(section)),
    ),
  ];
  const currentStep = stepKeys[stepIndex] ?? "aboutYou";
  const progressLabels: Record<string, string> = {
    aboutYou: "About you",
    skillsExperience: "Skills & experience",
    apest: "How you minister",
    spiritualGifts: "Gifts",
    passionsInterests: "Passions",
    naturalStrengths: "Strengths",
    personalityStrengths: "How you operate",
    spiritualHealth: "Spiritual health",
    connectionAvailability: "Connection",
  };
  const configuredMinistryQuestionCount = configuration?.ministryQuestionCount;
  const ministryQuestionsPerApproach =
    typeof configuredMinistryQuestionCount === "number" &&
    Number.isInteger(configuredMinistryQuestionCount) &&
    configuredMinistryQuestionCount >= 1 &&
    configuredMinistryQuestionCount <= 4
      ? configuredMinistryQuestionCount
      : 3;
  const activeMinistryQuestions = MINISTRY_QUESTIONS.filter(
    (question) =>
      question.questionIndex < ministryQuestionsPerApproach &&
      subsectionEnabled(
        `apest.${question.key}` as keyof NonNullable<
          typeof configuration
        >["subsections"],
      ),
  );
  const activeStrengthQuestions = STRENGTH_QUESTIONS.filter((question) =>
    subsectionEnabled(
      `naturalStrengths.${question.key}` as keyof NonNullable<
        typeof configuration
      >["subsections"],
    ),
  );
  const activePersonalityDimensions = PERSONALITY_DIMENSIONS.filter(
    (dimension) =>
      subsectionEnabled(
        `personalityStrengths.${dimension.key}` as keyof NonNullable<
          typeof configuration
        >["subsections"],
      ),
  );
  const activePersonalityQuestions = PERSONALITY_QUESTIONS_FLAT.filter(
    (question) =>
      activePersonalityDimensions.some(
        (dimension) => dimension.key === question.key,
      ),
  );
  const configuredSpiritualGiftQuestionCount =
    configuration?.spiritualGiftQuestionCount;
  const spiritualGiftQuestionsPerGift =
    typeof configuredSpiritualGiftQuestionCount === "number" &&
    Number.isInteger(configuredSpiritualGiftQuestionCount) &&
    configuredSpiritualGiftQuestionCount >= 1 &&
    configuredSpiritualGiftQuestionCount <= 4
      ? configuredSpiritualGiftQuestionCount
      : 3;
  const activeGiftConfigKey = `${church?.enabledSpiritualGifts?.join("|") ?? "all"}:${spiritualGiftQuestionsPerGift}`;
  const randomizedGiftQuestions = useMemo(
    () =>
      shuffleQuestions(
        activeSpiritualGifts.flatMap(([gift, meaning, prompts]) =>
          prompts.slice(0, spiritualGiftQuestionsPerGift).map((prompt, questionIndex) => ({
            gift,
            meaning,
            questionIndex,
            prompt,
          })),
        ),
      ),
    [activeGiftConfigKey],
  );
  const spiritualGiftQuestionCount =
    activeSpiritualGifts.length * spiritualGiftQuestionsPerGift;
  const answeredGiftQuestionCount = randomizedGiftQuestions.filter(
    ({ gift, questionIndex }) =>
      (form.watch(
        `spiritualGifts.responses.${gift}.${questionIndex}.response` as Path<Values>,
      ) as number) > 0,
  ).length;
  const answeredMinistryQuestionCount = activeMinistryQuestions.filter(
    ({ key, questionIndex }) =>
      (form.watch("ministryResponses")[`${key}-${questionIndex}`] ?? 0) > 0,
  ).length;
  const randomizedMinistryQuestions = useMemo(
    () =>
      shuffleQuestions(
        activeMinistryQuestions.map(({ key, tag, questionIndex, prompt }) => ({
          gift: key,
          tag,
          meaning: "",
          questionIndex,
          prompt,
        })),
      ),
    [configuration, ministryQuestionsPerApproach],
  );
  const answeredStrengthQuestionCount = activeStrengthQuestions.filter(
    ({ key, questionIndex }) =>
      (form.watch("strengthResponses")[`${key}-${questionIndex}`] ?? 0) > 0,
  ).length;
  const randomizedStrengthQuestions = useMemo(
    () =>
      shuffleQuestions(
        activeStrengthQuestions.map(({ key, questionIndex, prompt }) => ({
          gift: key,
          meaning: "",
          questionIndex,
          prompt,
        })),
      ),
    [configuration],
  );
  const answeredPersonalityQuestionCount = activePersonalityQuestions.filter(
    ({ key, questionIndex }) =>
      (form.watch("personalityResponses")[`${key}-${questionIndex}`] ?? 0) > 0,
  ).length;
  const currentPersonalityResults = personalityResults(
    Object.fromEntries(
      activePersonalityQuestions.map(({ key, questionIndex }) => [
        `${key}-${questionIndex}`,
        form.watch("personalityResponses")[`${key}-${questionIndex}`],
      ]),
    ),
    activePersonalityDimensions,
  );
  useEffect(() => {
    if (church && initializedGiftConfig.current !== activeGiftConfigKey) {
      initializedGiftConfig.current = activeGiftConfigKey;
      form.setValue("spiritualGifts", {
        responses: Object.fromEntries(
          activeSpiritualGifts.map(([gift, , prompts]) => [
            gift,
            prompts
              .slice(0, spiritualGiftQuestionsPerGift)
              .map((prompt) => ({ prompt, response: 0 })),
          ]),
        ),
      });
    }
  }, [
    activeGiftConfigKey,
    activeSpiritualGifts,
    church,
    form,
    spiritualGiftQuestionsPerGift,
  ]);
  useEffect(() => {
    if (!configuration) return;
    const hidden: string[] = [];
    const add = (enabled: boolean, ...names: string[]) => {
      if (!enabled) hidden.push(...names);
    };
    const enabled = (key: keyof typeof configuration.subsections) =>
      configuration.subsections[key];
    add(
      enabled("aboutYou.personalInformation"),
      "basicInformation.preferredContact",
      "basicInformation.familySituation",
      "basicInformation.transportation",
      "languageEntries",
    );
    add(
      enabled("aboutYou.skillsExperience"),
      "occupation",
      "skills.education",
      "skills.uniqueSkills",
    );
    add(enabled("aboutYou.lifeExperiences"), "lifeSelected", "lifeNotes");
    add(enabled("passionsInterests.passions"), "passions");
    add(enabled("passionsInterests.ministryInterests"), "interests");
    add(
      enabled("personalityStrengths.ministryPreferences"),
      "preferences.setting",
      "preferences.role",
      "preferences.routine",
      "preferences.team",
      "preferences.work",
      "preferences.rhythm",
    );
    add(
      enabled("connectionAvailability.churchConnection"),
      "churchConnection.attendanceLength",
      "churchConnection.connectionLevel",
      "churchConnection.followingJesusLength",
      "churchConnection.servedBefore",
      "churchConnection.previousService",
      "churchDetails.membership",
      "churchDetails.service",
      "churchDetails.previousInvolvement",
    );
    add(
      enabled("connectionAvailability.availability"),
      "servingFrequency",
      "availability",
      "availabilityDetails.seasonal",
      "availabilityDetails.specialEvents",
      "availabilityDetails.retreats",
      "availabilityDetails.missionTrips",
      "availabilityDetails.projects",
      "availabilityDetails.commitment",
      "availabilityDetails.responsibility",
    );
    (
      [
        "prayer",
        "scripture",
        "worship",
        "relationships",
        "community",
        "rest",
        "motivation",
        "wellbeing",
        "connection",
      ] as const
    ).forEach((key) =>
      add(enabled(`spiritualHealth.${key}`), `spiritualHealth.${key}`),
    );
    MINISTRY_QUESTIONS.filter(
      (question) =>
        question.questionIndex >= ministryQuestionsPerApproach ||
        !enabled(
          `apest.${question.key}` as keyof typeof configuration.subsections,
        ),
    ).forEach((question) =>
      hidden.push(
        `ministryResponses.${question.key}-${question.questionIndex}`,
      ),
    );
    STRENGTH_QUESTIONS.filter(
      (question) =>
        !enabled(
          `naturalStrengths.${question.key}` as keyof typeof configuration.subsections,
        ),
    ).forEach((question) =>
      hidden.push(
        `strengthResponses.${question.key}-${question.questionIndex}`,
      ),
    );
    PERSONALITY_QUESTIONS_FLAT.filter(
      (question) =>
        !enabled(
          `personalityStrengths.${question.key}` as keyof typeof configuration.subsections,
        ),
    ).forEach((question) =>
      hidden.push(
        `personalityResponses.${question.key}-${question.questionIndex}`,
      ),
    );
    form.unregister(hidden as Path<Values>[]);
  }, [configuration, form, ministryQuestionsPerApproach]);
  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (info.name) form.clearErrors(info.name as Path<Values>);
      if (
        info.name?.startsWith("spiritualGifts.responses.") &&
        Object.values(values.spiritualGifts?.responses ?? {})
          .flat()
          .every((item) => (item?.response ?? 0) > 0)
      )
        setReflectionValidationError("");
      if (
        info.name?.startsWith("ministryResponses.") &&
        activeMinistryQuestions.every(
          ({ key, questionIndex }) =>
            (values.ministryResponses?.[`${key}-${questionIndex}`] ?? 0) > 0,
        )
      )
        setReflectionValidationError("");
      if (
        info.name?.startsWith("strengthResponses.") &&
        Object.values(values.strengthResponses ?? {}).every(
          (response) => (response ?? 0) > 0,
        )
      )
        setReflectionValidationError("");
      if (
        info.name?.startsWith("personalityResponses.") &&
        Object.values(values.personalityResponses ?? {}).every(
          (response) => (response ?? 0) > 0,
        )
      )
        setReflectionValidationError("");
    });
    return () => subscription.unsubscribe();
  }, [activeMinistryQuestions, form]);
  const validateStep = () => {
    if (currentStep === "aboutYou") {
      const identity = form.getValues("basicInformation");
      const errors: [keyof typeof identity, string][] = [];
      if (!identity.firstName)
        errors.push(["firstName", "First name is required"]);
      if (!identity.lastName)
        errors.push(["lastName", "Last name is required"]);
      if (!z.string().email().safeParse(identity.email).success)
        errors.push(["email", "Enter a valid email"]);
      if (errors.length) {
        errors.forEach(([name, message]) =>
          form.setError(`basicInformation.${name}` as Path<Values>, {
            type: "manual",
            message,
          }),
        );
        return false;
      }
    }
    const unanswered =
      currentStep === "apest"
        ? randomizedMinistryQuestions.some(
            ({ gift, questionIndex }) =>
              !(form.getValues(
                `ministryResponses.${gift}-${questionIndex}` as Path<Values>,
              ) as number),
          )
        : currentStep === "spiritualGifts"
          ? randomizedGiftQuestions.some(
              ({ gift, questionIndex }) =>
                !(form.getValues(
                  `spiritualGifts.responses.${gift}.${questionIndex}.response` as Path<Values>,
                ) as number),
            )
          : currentStep === "naturalStrengths"
            ? randomizedStrengthQuestions.some(
                ({ gift, questionIndex }) =>
                  !(form.getValues(
                    `strengthResponses.${gift}-${questionIndex}` as Path<Values>,
                  ) as number),
              )
            : currentStep === "personalityStrengths"
              ? activePersonalityQuestions.some(
                  ({ key, questionIndex }) =>
                    !(form.getValues(
                      `personalityResponses.${key}-${questionIndex}` as Path<Values>,
                    ) as number),
                )
              : false;
    if (unanswered) {
      setReflectionValidationError(
        "Please answer every reflection before continuing.",
      );
    }
    const required: Path<Values>[] = [];
    if (currentStep === "passionsInterests") {
      if (
        subsectionEnabled("passionsInterests.passions") &&
        !form.getValues("passions").length
      )
        required.push("passions");
      if (
        subsectionEnabled("passionsInterests.ministryInterests") &&
        !form.getValues("interests").length
      )
        required.push("interests");
    }
    if (currentStep === "connectionAvailability") {
      if (subsectionEnabled("connectionAvailability.churchConnection"))
        [
          "churchConnection.attendanceLength",
          "churchConnection.followingJesusLength",
        ].forEach((name) => {
          if (!form.getValues(name as Path<Values>))
            required.push(name as Path<Values>);
        });
      if (subsectionEnabled("connectionAvailability.availability")) {
        if (!form.getValues("servingFrequency"))
          required.push("servingFrequency");
        if (!form.getValues("availability").length)
          required.push("availability");
        if (!form.getValues("availabilityDetails.responsibility"))
          required.push("availabilityDetails.responsibility");
      }
    }
    if (required.length) {
      required.forEach((name) =>
        form.setError(name, {
          type: "manual",
          message:
            name === "passions"
              ? "Select at least one passion"
              : name === "interests"
                ? "Select at least one ministry interest"
                : "This field is required",
        }),
      );
      return false;
    }
    if (!unanswered) return true;
    if (currentStep === "apest") {
      const firstUnansweredIndex = randomizedMinistryQuestions.findIndex(
        ({ gift, questionIndex }) =>
          !form.getValues(
            `ministryResponses.${gift}-${questionIndex}` as Path<Values>,
          ),
      );
      if (firstUnansweredIndex >= 0) {
        setReflectionValidationError(
          `Please answer all ${activeMinistryQuestions.length} ministry reflections before continuing. The first unanswered reflection is question ${firstUnansweredIndex + 1}.`,
        );
        requestAnimationFrame(() =>
          giftGroupRefs.current[
            `ministry-${randomizedMinistryQuestions[firstUnansweredIndex].gift}-${randomizedMinistryQuestions[firstUnansweredIndex].questionIndex}`
          ]?.focus(),
        );
      }
    }
    if (currentStep === "spiritualGifts") {
      const firstUnanswered = randomizedGiftQuestions.find(
        ({ gift, questionIndex }) =>
          !form.getValues(
            `spiritualGifts.responses.${gift}.${questionIndex}.response` as Path<Values>,
          ),
      );
      if (firstUnanswered) {
        setReflectionValidationError(
          `Please answer all ${spiritualGiftQuestionCount} spiritual gifts reflections before continuing. The first unanswered reflection is question ${randomizedGiftQuestions.findIndex((question) => question.gift === firstUnanswered.gift && question.questionIndex === firstUnanswered.questionIndex) + 1}.`,
        );
        requestAnimationFrame(() =>
          giftGroupRefs.current[
            `${firstUnanswered.gift}-${firstUnanswered.questionIndex}`
          ]?.focus(),
        );
      }
    }
    if (currentStep === "naturalStrengths") {
      const firstUnansweredIndex = randomizedStrengthQuestions.findIndex(
        ({ gift, questionIndex }) =>
          !form.getValues(
            `strengthResponses.${gift}-${questionIndex}` as Path<Values>,
          ),
      );
      if (firstUnansweredIndex >= 0) {
        setReflectionValidationError(
          `Please answer all ${activeStrengthQuestions.length} strengths reflections before continuing. The first unanswered reflection is question ${firstUnansweredIndex + 1}.`,
        );
        requestAnimationFrame(() =>
          giftGroupRefs.current[
            `strength-${randomizedStrengthQuestions[firstUnansweredIndex].gift}-${randomizedStrengthQuestions[firstUnansweredIndex].questionIndex}`
          ]?.focus(),
        );
      }
    }
    if (currentStep === "personalityStrengths") {
      const firstUnansweredIndex = activePersonalityQuestions.findIndex(
        ({ key, questionIndex }) =>
          !form.getValues(
            `personalityResponses.${key}-${questionIndex}` as Path<Values>,
          ),
      );
      if (firstUnansweredIndex >= 0) {
        setReflectionValidationError(
          `Please answer all ${activePersonalityQuestions.length} personality reflections before continuing. The first unanswered reflection is question ${firstUnansweredIndex + 1}.`,
        );
        requestAnimationFrame(() =>
          giftGroupRefs.current[
            `personality-${activePersonalityQuestions[firstUnansweredIndex].key}-${activePersonalityQuestions[firstUnansweredIndex].questionIndex}`
          ]?.focus(),
        );
      }
    }
    return false;
  };
  const next = () => {
    if (!validateStep()) return;
    setStepIndex((value) => Math.min(value + 1, stepKeys.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = (data: Values) => {
    if (submissionStarted.current || photoUploading) return;
    submissionStarted.current = true;
    setSubmitError("");
    const activeMinistryKeys = new Set(
      activeMinistryQuestions.map(
        ({ key, questionIndex }) => `${key}-${questionIndex}`,
      ),
    );
    const activeStrengthKeys = new Set(
      activeStrengthQuestions.map(
        ({ key, questionIndex }) => `${key}-${questionIndex}`,
      ),
    );
    const activePersonalityKeys = new Set(
      activePersonalityQuestions.map(
        ({ key, questionIndex }) => `${key}-${questionIndex}`,
      ),
    );
    const ministryResponses = Object.fromEntries(
      Object.entries(data.ministryResponses).filter(([key]) =>
        activeMinistryKeys.has(key),
      ),
    );
    const strengthResponses = Object.fromEntries(
      Object.entries(data.strengthResponses).filter(([key]) =>
        activeStrengthKeys.has(key),
      ),
    );
    const personalityResponses = Object.fromEntries(
      Object.entries(data.personalityResponses).filter(([key]) =>
        activePersonalityKeys.has(key),
      ),
    );
    const enabledMinistry = MINISTRY_APPROACHES.filter(({ key }) =>
      subsectionEnabled(
        `apest.${key}` as keyof NonNullable<
          typeof configuration
        >["subsections"],
      ),
    );
    const ministryResults = enabledMinistry
      .map(({ label, key, prompts }) => ({
        label,
        score: prompts
          .slice(0, ministryQuestionsPerApproach)
          .reduce(
            (total, _prompt, questionIndex) =>
              total + (ministryResponses[`${key}-${questionIndex}`] ?? 0),
            0,
          ),
      }))
      .sort((a, b) => b.score - a.score);
    const enabledStrengths = STRENGTH_APPROACHES.filter(({ key }) =>
      subsectionEnabled(
        `naturalStrengths.${key}` as keyof NonNullable<
          typeof configuration
        >["subsections"],
      ),
    );
    const strengthResults = enabledStrengths
      .map(({ label, key, prompts }) => ({
        label,
        score: prompts.reduce(
          (total, _prompt, questionIndex) =>
            total + (strengthResponses[`${key}-${questionIndex}`] ?? 0),
          0,
        ),
      }))
      .sort((a, b) => b.score - a.score);
    const results = personalityResults(
      personalityResponses,
      activePersonalityDimensions,
    );
    const languageEntries = data.languageEntries
      .map((entry) => ({
        language: entry.language.trim(),
        proficiency: entry.proficiency || null,
      }))
      .filter((entry) => entry.language);
    const payload: ProfileInput = {
      ...(subsectionEnabled("aboutYou.profilePhoto") && profilePhotoPath
        ? { profilePhotoPath }
        : {}),
      churchSlug: slug,
      journeyToken: localStorage.getItem("every-part-journey-token") || undefined,
      inviteToken: inviteToken || undefined,
      basicInformation: {
        firstName: data.basicInformation.firstName,
        lastName: data.basicInformation.lastName,
        email: data.basicInformation.email,
        phone: subsectionEnabled("aboutYou.phone")
          ? data.basicInformation.phone || null
          : null,
        ...(subsectionEnabled("aboutYou.personalInformation")
          ? {
              preferredContact: subsectionEnabled("aboutYou.preferredContact")
                ? data.basicInformation.preferredContact || null
                : null,
              familySituation: subsectionEnabled("aboutYou.familySituation")
                ? data.basicInformation.familySituation || null
                : null,
              transportation: subsectionEnabled("aboutYou.transportation")
                ? data.basicInformation.transportation || null
                : null,
            }
          : {}),
      },
      ...(subsectionEnabled("connectionAvailability.churchConnection")
        ? {
            churchConnection: {
              ...data.churchConnection,
              previousService: data.churchConnection.previousService || null,
            },
          }
        : {}),
      ...(subsectionEnabled("passionsInterests.passions")
        ? { passions: data.passions }
        : {}),
      ...(subsectionEnabled("passionsInterests.ministryInterests")
        ? { interests: data.interests }
        : {}),
      ...(subsectionEnabled("connectionAvailability.availability")
        ? {
            servingFrequency: data.servingFrequency,
            availability: data.availability,
            availabilityDetails: data.availabilityDetails,
          }
        : {}),
      ...(subsectionEnabled("aboutYou.skillsExperience")
        ? {
            skills: {
              occupation: data.occupation || null,
              uniqueSkills: data.skills.uniqueSkills || null,
              previousMinistryExperience: null,
              leadershipExperience: null,
              missionTripExperience: null,
              lifeExperience: null,
            },
            skillsDetails: {
              context: data.occupation || null,
              training: data.skills.education || null,
              enjoys: data.skills.uniqueSkills || null,
            },
          }
        : {}),
      ...(subsectionEnabled("aboutYou.personalInformation") &&
      subsectionEnabled("aboutYou.languages") &&
      languageEntries.length
        ? {
            languages: {
              entries: languageEntries,
              spoken: languageEntries.map((entry) => entry.language),
            },
          }
        : {}),
      ...(subsectionEnabled("connectionAvailability.churchConnection")
        ? { churchDetails: data.churchDetails }
        : {}),
      ...(subsectionEnabled("aboutYou.lifeExperiences")
        ? {
            lifeExperiences: {
              selected: data.lifeSelected,
              notes: data.lifeNotes,
            },
          }
        : {}),
      ...(subsectionEnabled("personalityStrengths.ministryPreferences")
        ? { ministryPreferences: data.preferences }
        : {}),
      assessmentSections: {
        ...(sectionEnabled("spiritualGifts") && activeSpiritualGifts.length
          ? {
              spiritualGifts: {
                responses: Object.fromEntries(
                  activeSpiritualGifts.map(([gift]) => [
                    gift,
                    data.spiritualGifts.responses[gift].slice(
                      0,
                      spiritualGiftQuestionsPerGift,
                    ),
                  ]),
                ),
              },
            }
          : {}),
        ...(sectionEnabled("apest") && activeMinistryQuestions.length
          ? {
              apest: {
                primary: ministryResults[0]?.label || null,
                secondary: ministryResults[1]?.label || null,
                responses: ministryResponses,
              },
            }
          : {}),
        ...(sectionEnabled("naturalStrengths") && activeStrengthQuestions.length
          ? {
              naturalStrengths: {
                selected: strengthResults.slice(0, 5).map(({ label }) => label),
                notes: data.strengthNotes || null,
                responses: strengthResponses,
              },
            }
          : {}),
        ...(sectionEnabled("personalityStrengths") &&
        activePersonalityQuestions.length
          ? {
              personalityStrengths: {
                dimensions: results,
                summary: personalitySummary(results),
                ministryConnection: personalityMinistryConnection(results),
                responses: personalityResponses,
              },
            }
          : {}),
        ...(sectionEnabled("spiritualHealth") &&
        hasEnabledSubsections("spiritualHealth")
          ? {
              spiritualHealth: Object.fromEntries(
                Object.entries(data.spiritualHealth).filter(([key]) =>
                  subsectionEnabled(
                    `spiritualHealth.${key}` as keyof NonNullable<
                      typeof configuration
                    >["subsections"],
                  ),
                ),
              ),
            }
          : {}),
      },
      age,
      birthdate,
      profileType: "adult",
    };
    createProfile.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          localStorage.setItem("every-part-journey-token", result.journeyToken);
          setStepIndex(stepKeys.length);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: (error) => {
          submissionStarted.current = false;
          setSubmitError(profileSubmissionError(error));
        },
      },
    );
  };
  if (isLoading)
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (churchError || !church)
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <Card>
          <CardContent className="p-8">
            Church not found. <Link href="/">Return home</Link>
          </CardContent>
        </Card>
      </div>
    );
  const brandStyle = {
    "--primary": hexToHsl(church.primaryColor),
    "--primary-foreground": colorForeground(church.primaryColor),
    "--ring": hexToHsl(church.primaryColor),
    "--secondary": hexToHsl(church.accentColor),
    "--secondary-foreground": colorForeground(church.accentColor),
    "--accent": hexToHsl(church.accentColor),
    "--accent-foreground": colorForeground(church.accentColor),
  } as React.CSSProperties;
  const churchLogo = brandLogoSource(church.logoUrl);
  if (!started)
    return (
      <div
        style={brandStyle}
        className="pathway-theme pathway-theme-adult min-h-screen grid place-items-center bg-muted/20 p-4"
      >
        <Card className="max-w-xl text-center">
          <CardContent className="p-10 space-y-6">
            {churchLogo ? (
              <img
                src={churchLogo}
                alt={`${church.name} logo`}
                className="mx-auto max-h-24 max-w-[240px] object-contain"
              />
            ) : (
              <HeartHandshake className="w-12 h-12 mx-auto text-primary" />
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                {church.name}
              </p>
              <h1 className="font-serif text-4xl">Your Ministry Profile</h1>
            </div>
            <p className="text-muted-foreground">
              We all have a part in the Body of Christ—and every part matters.
              God has uniquely shaped you with gifts, experiences, interests,
              and a story that can be used to bless others and build up His
              church. This assessment is simply a tool to help you and your
              church discover more about your part and where you may serve with
              joy and purpose. There are no perfect answers here—just an
              opportunity to pray, reflect, and learn a little more about how
              God may be inviting you to serve.
            </p>
            <Button
              onClick={() => {
                setStep(0);
                setStarted(true);
              }}
            >
              Begin <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  if (stepIndex === stepKeys.length || createProfile.isSuccess)
    return (
      <div
        style={brandStyle}
        className="pathway-theme pathway-theme-adult min-h-screen grid place-items-center p-4"
      >
        <Card className="max-w-md text-center">
          <CardContent className="p-10 space-y-5">
            {churchLogo && (
              <img
                src={churchLogo}
                alt={`${church.name} logo`}
                className="mx-auto max-h-20 max-w-[220px] object-contain"
              />
            )}
            <CheckCircle2 className="w-14 h-14 mx-auto text-primary" />
            <h1 className="font-serif text-3xl">Thank you</h1>
            <p className="text-muted-foreground">
              Your profile has been shared with {church.name}. A leader can
              follow up thoughtfully about next steps.
            </p>
            {createProfile.data?.journeyToken && (
              <Button asChild variant="outline">
                <Link href={`/journey/${createProfile.data.journeyToken}`}>
                  View your private ministry journey
                </Link>
              </Button>
            )}
            <Button asChild>
              <a href={church.profileUrl || "/"}>Return to church profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div style={brandStyle} className="pathway-theme pathway-theme-adult min-h-[100dvh] bg-muted/20">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {churchLogo && (
              <img
                src={churchLogo}
                alt=""
                className="h-9 w-9 shrink-0 object-contain"
              />
            )}
            <strong className="truncate">{church.name}</strong>
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground" aria-live="polite">
            Step {stepIndex + 1} of {stepKeys.length}
          </span>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <ProfileParts
            parts={stepKeys.map((key) => ({ label: progressLabels[key] ?? key }))}
            current={stepIndex + 1}
            label="Your reflection"
          />
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 md:p-10">
        <AssessmentConfigurationContext.Provider
          value={{ configuration: configuration!, step: currentStep }}
        >
          <Form {...form}>
            <form onSubmit={(event) => event.preventDefault()}>
              <Card>
                <CardContent className="p-6 md:p-10 space-y-8">
                  {currentStep === "aboutYou" && (
                    <>
                      <Heading description="Start with how your church can reach you. Everything else on this page is optional.">
                        About You
                      </Heading>
                      <div className="grid md:grid-cols-2 gap-5">
                        <TextField
                          form={form}
                          name="basicInformation.firstName"
                          label="First name"
                        />
                        <TextField
                          form={form}
                          name="basicInformation.lastName"
                          label="Last name"
                        />
                        <TextField
                          form={form}
                          name="basicInformation.email"
                          label="Email"
                        />
                        <TextField
                          form={form}
                          name="basicInformation.phone"
                          label="Phone (optional)"
                        />
                        <SelectField
                          form={form}
                          name="basicInformation.preferredContact"
                          label="Preferred contact method"
                          options={["Email", "Phone", "Text"]}
                        />
                      </div>
                      {optionalAboutYouPanelEnabled && (
                      <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
                        <div className="space-y-6">
                          <p className="text-sm font-medium">
                            Family, transportation, languages, and photo
                          </p>
                          <div className="grid gap-5 md:grid-cols-2">
                            <SelectField
                              form={form}
                              name="basicInformation.familySituation"
                              label="Family situation"
                              options={[
                                "Single",
                                "Married",
                                "Married with kids at home",
                                "Empty nester",
                                "Other",
                              ]}
                            />
                            <SelectField
                              form={form}
                              name="basicInformation.transportation"
                              label="Transportation"
                              options={[
                                "Reliable transportation",
                                "Sometimes need transportation",
                                "Would like to discuss",
                              ]}
                            />
                          </div>
                          {subsectionEnabled("aboutYou.languages") && (
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium">
                                Languages spoken
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Add each language and its proficiency.
                              </p>
                            </div>
                            {languageFields.map((languageField, index) => (
                              <div
                                key={languageField.id}
                                className="grid gap-3 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                              >
                                <FormField
                                  control={form.control}
                                  name={`languageEntries.${index}.language`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Language</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. Spanish"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`languageEntries.${index}.proficiency`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Proficiency</FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select proficiency" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {[
                                            "Basic conversation",
                                            "Conversational",
                                            "Fluent",
                                            "Native/bilingual",
                                          ].map((option) => (
                                            <SelectItem
                                              key={option}
                                              value={option}
                                            >
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                {languageFields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Remove language ${index + 1}`}
                                    onClick={() => removeLanguage(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                appendLanguage({
                                  language: "",
                                  proficiency: "",
                                })
                              }
                            >
                              <Plus className="mr-1.5 h-4 w-4" />
                              Add another language
                            </Button>
                          </div>
                          )}
                          {subsectionEnabled("aboutYou.profilePhoto") && (
                          <ProfilePhotoUploader
                            churchSlug={slug}
                            name={`${form.watch("basicInformation.firstName")} ${form.watch("basicInformation.lastName")}`}
                            value={profilePhotoPath}
                            onChange={setProfilePhotoPath}
                            onUploadingChange={setPhotoUploading}
                          />
                          )}
                        </div>
                      </div>
                      )}
                    </>
                  )}
                  {currentStep === "skillsExperience" && (
                    <>
                      <Heading description="This isn't a résumé or an audition. Share what helps others understand what you bring. Every field is optional.">
                        What You Bring
                      </Heading>
                      <div className="space-y-5">
                        <TextField
                          form={form}
                          name="occupation"
                          label="Work, study, or current life context"
                          description="Share what you're doing these days, or what your current season of life has given you."
                        />
                        <TextField
                          form={form}
                          name="skills.education"
                          label="Training or certifications you'd like to share"
                          description="Include anything relevant from school, work, ministry, hobbies, or other learning."
                        />
                        <TextField
                          form={form}
                          name="skills.uniqueSkills"
                          label="What kinds of things do you enjoy doing with or for other people?"
                          description="Think broadly: welcoming, listening, teaching, organizing, creating, caring, solving problems, working with your hands, or simply being present with people."
                          multiline
                        />
                      </div>
                      <Heading description="Optional. Share only what feels relevant, and nothing private that you do not want to explain.">
                        Experiences That Have Shaped You
                      </Heading>
                      <TextField
                        form={form}
                        name="lifeNotes"
                        label="Is there anything you would like church leaders to understand about your experience?"
                        description="You do not need to share anything private or explain anything you are not comfortable sharing."
                        multiline
                      />
                    </>
                  )}
                  {currentStep === "apest" && (
                    <>
                      <Heading description="Read each statement and choose how well it fits your experience. There are no right answers; use what feels true of how you naturally serve and relate to others.">
                          How You Minister
                      </Heading>
                      <p className="text-sm text-muted-foreground">
                        Traditional tags are included as shorthand for each
                        reflection category; they are not fixed labels or
                        placement decisions.
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {answeredMinistryQuestionCount} of{" "}
                        {activeMinistryQuestions.length} reflections answered
                      </p>
                      {reflectionValidationError && (
                        <p
                          role="alert"
                          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                        >
                          {reflectionValidationError}
                        </p>
                      )}
                      <div className="space-y-4">
                        {randomizedMinistryQuestions.map(
                          ({ gift, tag, questionIndex, prompt }, displayIndex) => {
                            const responseKey = `${gift}-${questionIndex}`;
                            const questionId = `ministry-reflection-${displayIndex}`;
                            return (
                              <section
                                key={responseKey}
                                className="rounded-xl border bg-card p-4"
                              >
                                <FormField
                                  control={form.control}
                                  name={
                                    `ministryResponses.${responseKey}` as Path<Values>
                                  }
                                  render={({ field }) => {
                                    const unanswered = Boolean(
                                      reflectionValidationError && !field.value,
                                    );
                                    const errorId = `ministry-reflection-error-${displayIndex}`;
                                    return (
                                      <FormItem>
                                        <div className="mb-2 flex items-center gap-2">
                                          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary">
                                            {tag}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            reflection category
                                          </span>
                                        </div>
                                        <p
                                          id={questionId}
                                          className="text-sm leading-6"
                                        >
                                          {prompt}
                                        </p>
                                        <div
                                          ref={(element) => {
                                            giftGroupRefs.current[
                                              `ministry-${responseKey}`
                                            ] = element;
                                          }}
                                          tabIndex={-1}
                                          role="radiogroup"
                                          aria-labelledby={questionId}
                                          aria-invalid={unanswered}
                                          aria-describedby={
                                            unanswered ? errorId : undefined
                                          }
                                          className="mt-3 flex flex-wrap gap-2 outline-none"
                                        >
                                          {RESPONSE_OPTIONS.map(
                                            (option, optionIndex) => (
                                              <Button
                                                key={option}
                                                type="button"
                                                role="radio"
                                                aria-checked={
                                                  field.value ===
                                                  optionIndex + 1
                                                }
                                                variant={
                                                  field.value ===
                                                  optionIndex + 1
                                                    ? "default"
                                                    : "outline"
                                                }
                                                className="text-xs"
                                                onClick={() =>
                                                  field.onChange(
                                                    optionIndex + 1,
                                                  )
                                                }
                                              >
                                                {option}
                                              </Button>
                                            ),
                                          )}
                                        </div>
                                        {unanswered && (
                                          <p
                                            id={errorId}
                                            className="mt-2 text-sm text-destructive"
                                          >
                                            Please choose a response for this
                                            reflection.
                                          </p>
                                        )}
                                      </FormItem>
                                    );
                                  }}
                                />
                              </section>
                            );
                          },
                        )}
                      </div>
                    </>
                  )}
                  {currentStep === "spiritualGifts" && (
                    <>
                      <Heading description="Read each statement and choose how well it fits your lived experience. This is a conversation starter, not a test of spiritual maturity or a placement decision. Choose “Not at all” when a statement does not fit.">
                        {spiritualGiftsLabel}
                      </Heading>
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {answeredGiftQuestionCount} of{" "}
                        {spiritualGiftQuestionCount} reflections answered
                      </p>
                      {reflectionValidationError && (
                        <p
                          role="alert"
                          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                        >
                          {reflectionValidationError}
                        </p>
                      )}
                      <div className="space-y-4">
                        {randomizedGiftQuestions.map(
                          ({ gift, questionIndex, prompt }, displayIndex) => {
                            const questionId = `gift-reflection-${displayIndex}`;
                            return (
                              <section
                                key={`${gift}-${questionIndex}`}
                                className="rounded-xl border bg-card p-4"
                              >
                                <FormField
                                  control={form.control}
                                  name={
                                    `spiritualGifts.responses.${gift}.${questionIndex}.response` as Path<Values>
                                  }
                                  render={({ field }) => {
                                    const unanswered = Boolean(
                                      reflectionValidationError && !field.value,
                                    );
                                    const errorId = `gift-reflection-error-${displayIndex}`;
                                    return (
                                      <FormItem>
                                        <p
                                          id={questionId}
                                          className="text-sm leading-6"
                                        >
                                          {prompt}
                                        </p>
                                        <div
                                          ref={(element) => {
                                            giftGroupRefs.current[
                                              `${gift}-${questionIndex}`
                                            ] = element;
                                          }}
                                          tabIndex={-1}
                                          role="radiogroup"
                                          aria-labelledby={questionId}
                                          aria-invalid={unanswered}
                                          aria-describedby={
                                            unanswered ? errorId : undefined
                                          }
                                          className="mt-3 flex flex-wrap gap-2 outline-none"
                                        >
                                          {RESPONSE_OPTIONS.map(
                                            (option, optionIndex) => (
                                              <Button
                                                key={option}
                                                type="button"
                                                role="radio"
                                                aria-checked={
                                                  field.value ===
                                                  optionIndex + 1
                                                }
                                                variant={
                                                  field.value ===
                                                  optionIndex + 1
                                                    ? "default"
                                                    : "outline"
                                                }
                                                className="text-xs"
                                                onClick={() =>
                                                  field.onChange(
                                                    optionIndex + 1,
                                                  )
                                                }
                                              >
                                                {option}
                                              </Button>
                                            ),
                                          )}
                                        </div>
                                        {unanswered && (
                                          <p
                                            id={errorId}
                                            className="mt-2 text-sm text-destructive"
                                          >
                                            Please choose a response for this
                                            reflection.
                                          </p>
                                        )}
                                      </FormItem>
                                    );
                                  }}
                                />
                              </section>
                            );
                          },
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="spiritualGifts.responses"
                        render={() => (
                          <FormItem>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  {currentStep === "passionsInterests" && (
                    <>
                      <Heading description="Who or what has God put on your heart?">
                        Who and where you are drawn toward (Passions)
                      </Heading>
                      <p className="text-sm text-muted-foreground">
                        Share the people, communities, and ministry areas you
                        feel drawn to explore.
                      </p>
                      <MultiSelect
                        form={form}
                        name="passions"
                        options={passionOptions}
                      />
                      <Heading configKey="passionsInterests.ministryInterests">
                        {ministryInterestsLabel}
                      </Heading>
                      <p className="text-sm text-muted-foreground">
                        Actual ministry areas you would like to explore.
                      </p>
                      <MultiSelect
                        form={form}
                        name="interests"
                        options={ministryInterestOptions}
                      />
                    </>
                  )}
                  {currentStep === "naturalStrengths" && (
                    <>
                      <Heading description="This strengths-based reflection looks for recurring ways you contribute, learn, relate, and solve problems. It is not a branded strengths test, diagnosis, or placement decision.">
                        What you naturally do well (Strengths)
                      </Heading>
                      <p className="text-sm text-muted-foreground">
                        Read each statement and choose how well it fits your
                        experience in ministry, work, home, or community.
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {answeredStrengthQuestionCount} of{" "}
                        {activeStrengthQuestions.length} reflections answered
                      </p>
                      {reflectionValidationError && (
                        <p
                          role="alert"
                          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                        >
                          {reflectionValidationError}
                        </p>
                      )}
                      <div className="space-y-4">
                        {randomizedStrengthQuestions.map(
                          ({ gift, questionIndex, prompt }, displayIndex) => {
                            const responseKey = `${gift}-${questionIndex}`;
                            const questionId = `strength-reflection-${displayIndex}`;
                            return (
                              <section
                                key={responseKey}
                                className="rounded-xl border bg-card p-4"
                              >
                                <FormField
                                  control={form.control}
                                  name={
                                    `strengthResponses.${responseKey}` as Path<Values>
                                  }
                                  render={({ field }) => {
                                    const unanswered = Boolean(
                                      reflectionValidationError && !field.value,
                                    );
                                    const errorId = `strength-reflection-error-${displayIndex}`;
                                    return (
                                      <FormItem>
                                        <p
                                          id={questionId}
                                          className="text-sm leading-6"
                                        >
                                          {prompt}
                                        </p>
                                        <div
                                          ref={(element) => {
                                            giftGroupRefs.current[
                                              `strength-${responseKey}`
                                            ] = element;
                                          }}
                                          tabIndex={-1}
                                          role="radiogroup"
                                          aria-labelledby={questionId}
                                          aria-invalid={unanswered}
                                          aria-describedby={
                                            unanswered ? errorId : undefined
                                          }
                                          className="mt-3 flex flex-wrap gap-2 outline-none"
                                        >
                                          {RESPONSE_OPTIONS.map(
                                            (option, optionIndex) => (
                                              <Button
                                                key={option}
                                                type="button"
                                                role="radio"
                                                aria-checked={
                                                  field.value ===
                                                  optionIndex + 1
                                                }
                                                variant={
                                                  field.value ===
                                                  optionIndex + 1
                                                    ? "default"
                                                    : "outline"
                                                }
                                                className="text-xs"
                                                onClick={() =>
                                                  field.onChange(
                                                    optionIndex + 1,
                                                  )
                                                }
                                              >
                                                {option}
                                              </Button>
                                            ),
                                          )}
                                        </div>
                                        {unanswered && (
                                          <p
                                            id={errorId}
                                            className="mt-2 text-sm text-destructive"
                                          >
                                            Please choose a response for this
                                            reflection.
                                          </p>
                                        )}
                                      </FormItem>
                                    );
                                  }}
                                />
                              </section>
                            );
                          },
                        )}
                      </div>
                      <TextField
                        form={form}
                        name="strengthNotes"
                        label="Where do you see these strengths in action? (optional)"
                        description="Share examples from ministry, work, home, or community."
                        multiline
                      />
                    </>
                  )}
                  {currentStep === "personalityStrengths" && (
                    <>
                      <Heading description="How You Tend to Operate">
                        Personality
                      </Heading>
                      <div className="space-y-3 text-sm leading-6">
                        <p>
                          God has created each person with a unique personality.
                          This section is designed to help you understand how
                          you naturally tend to operate — how you gain energy,
                          make decisions, approach plans, process information,
                          work with others, and respond to different
                          environments.
                        </p>
                        <p>
                          There are no good or bad personality results. Every
                          style brings strengths to the Body of Christ, and God
                          can also grow and stretch us beyond what feels most
                          natural.
                        </p>
                        <p className="text-muted-foreground">
                          Your personality does not determine your calling,
                          spiritual gifts, or value. It is simply one part of
                          understanding how you may naturally approach life and
                          ministry.
                        </p>
                      </div>
                      <p
                        className="text-sm text-muted-foreground"
                        aria-live="polite"
                      >
                        {answeredPersonalityQuestionCount} of{" "}
                        {activePersonalityQuestions.length} reflections answered
                      </p>
                      {reflectionValidationError && (
                        <p
                          role="alert"
                          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                        >
                          {reflectionValidationError}
                        </p>
                      )}
                      <div className="space-y-5">
                        {activePersonalityDimensions.map((dimension) => (
                          <section
                            key={dimension.key}
                            className="rounded-xl border bg-card p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-medium">
                                  {dimension.label}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dimension.description}
                                </p>
                              </div>
                              <span className="hidden sm:block text-xs text-muted-foreground">
                                {dimension.left} ↔ {dimension.right}
                              </span>
                            </div>
                            <div className="mt-4 space-y-4">
                              {activePersonalityQuestions.filter(
                                (question) => question.key === dimension.key,
                              ).map(({ prompt, questionIndex }) => (
                                <FormField
                                  key={`${dimension.key}-${questionIndex}`}
                                  control={form.control}
                                  name={
                                    `personalityResponses.${dimension.key}-${questionIndex}` as Path<Values>
                                  }
                                  render={({ field }) => {
                                    const unanswered = Boolean(
                                      reflectionValidationError && !field.value,
                                    );
                                    const errorId = `personality-reflection-error-${dimension.key}-${questionIndex}`;
                                    const questionId = `personality-reflection-${dimension.key}-${questionIndex}`;
                                    return (
                                      <FormItem>
                                        <p
                                          id={questionId}
                                          className="text-sm leading-6"
                                        >
                                          {prompt}
                                        </p>
                                        <div
                                          ref={(element) => {
                                            giftGroupRefs.current[
                                              `personality-${dimension.key}-${questionIndex}`
                                            ] = element;
                                          }}
                                          tabIndex={-1}
                                          role="radiogroup"
                                          aria-labelledby={questionId}
                                          aria-invalid={unanswered}
                                          aria-describedby={
                                            unanswered ? errorId : undefined
                                          }
                                          className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 outline-none"
                                        >
                                          {personalityResponseOptions(
                                            dimension.left,
                                            dimension.right,
                                          ).map((option, optionIndex) => (
                                            <Button
                                              key={option}
                                              type="button"
                                              role="radio"
                                              aria-checked={
                                                field.value === optionIndex + 1
                                              }
                                              variant={
                                                field.value === optionIndex + 1
                                                  ? "default"
                                                  : "outline"
                                              }
                                              className="h-auto min-h-10 px-2 text-xs"
                                              onClick={() =>
                                                field.onChange(optionIndex + 1)
                                              }
                                            >
                                              {option}
                                            </Button>
                                          ))}
                                        </div>
                                        {unanswered && (
                                          <p
                                            id={errorId}
                                            className="mt-2 text-sm text-destructive"
                                          >
                                            Please choose a response for this
                                            reflection.
                                          </p>
                                        )}
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                      {answeredPersonalityQuestionCount ===
                        activePersonalityQuestions.length && (
                        <PersonalityResultsView
                          results={currentPersonalityResults}
                        />
                      )}
                      <Heading description="Optional preferences help begin a thoughtful conversation, not determine placement.">
                        Ministry Preferences & Environment
                      </Heading>
                      <div className="grid md:grid-cols-2 gap-5">
                        {(
                          [
                            [
                              "setting",
                              "Working style",
                              "With people",
                              "Behind the scenes",
                            ],
                            [
                              "role",
                              "Role preference",
                              "Leading",
                              "Supporting",
                            ],
                            [
                              "routine",
                              "Environment",
                              "Predictable routines",
                              "Changing environments",
                            ],
                            [
                              "team",
                              "Team setting",
                              "Alone",
                              "Small team",
                              "Large group",
                            ],
                            [
                              "work",
                              "Ministry expression",
                              "Relational",
                              "Practical service",
                              "Teaching",
                              "Administration",
                              "Creative work",
                              "Outreach",
                            ],
                            [
                              "rhythm",
                              "Role rhythm",
                              "Weekly in one role",
                              "Occasionally in several roles",
                            ],
                          ] as const
                        ).map(([name, label, ...options]) => (
                          <SelectField
                            key={name}
                            form={form}
                            name={`preferences.${name}`}
                            label={label}
                            options={options}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {currentStep === "spiritualHealth" && (
                    <>
                      <Heading description="Pastoral self-reflection only — never pass/fail or scored. Share only what you are comfortable sharing.">
                        How you are doing (Spiritual Health)
                      </Heading>
                      <div className="grid md:grid-cols-2 gap-5">
                        {(
                          [
                            "prayer",
                            "scripture",
                            "worship",
                            "relationships",
                            "community",
                            "rest",
                            "motivation",
                            "wellbeing",
                            "connection",
                          ] as const
                        ).map((name) => (
                          <SelectField
                            key={name}
                            form={form}
                            name={`spiritualHealth.${name}`}
                            label={
                              name === "worship"
                                ? "Worship/church engagement"
                                : name === "community"
                                  ? "Community/accountability"
                                  : name === "rest"
                                    ? "Rest/Sabbath"
                                    : name === "wellbeing"
                                      ? "Emotional/spiritual well-being"
                                      : name === "connection"
                                        ? "Current connection with God"
                                        : name[0].toUpperCase() + name.slice(1)
                            }
                            options={[
                              "Needs attention",
                              "Growing",
                              "Steady",
                              "Feeling strong",
                              "Prefer not to say",
                            ]}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {currentStep === "connectionAvailability" && (
                    <>
                      <Heading description="Tell us how you experience church life and where you are currently connected or serving.">
                        How you are connected
                      </Heading>
                      <div className="grid md:grid-cols-2 gap-5">
                        <SelectField
                          form={form}
                          name="churchConnection.attendanceLength"
                          label="How long have you attended?"
                          options={[
                            "Just visiting",
                            "Less than 6 months",
                            "6–12 months",
                            "1–3 years",
                            "3+ years",
                          ]}
                        />
                        <SelectField
                          form={form}
                          name="churchConnection.followingJesusLength"
                          label="How long have you followed Jesus?"
                          options={[
                            "Still exploring",
                            "Less than 1 year",
                            "1–3 years",
                            "3–5 years",
                            "5–10 years",
                            "10+ years",
                          ]}
                        />
                        <SelectField
                          form={form}
                          name="churchDetails.membership"
                          label="Membership"
                          options={[
                            "Member",
                            "Not currently a member",
                            "Interested in learning more",
                            "Prefer not to say",
                          ]}
                        />
                        <TextField
                          form={form}
                          name="churchDetails.service"
                          label="Service or congregation you attend (optional)"
                        />
                        <TextField
                          form={form}
                          name="churchDetails.previousInvolvement"
                          label="Previous church involvement (optional)"
                          multiline
                        />
                      </div>
                      {subsectionEnabled(
                        "connectionAvailability.churchConnection",
                      ) && (
                        <>
                          <FormField
                            control={form.control}
                            name="churchConnection.connectionLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  How connected do you feel here? (self-reported)
                                </FormLabel>
                                <div
                                  role="radiogroup"
                                  aria-label="Church connection level"
                                  className="flex gap-2"
                                >
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <Button
                                      key={level}
                                      type="button"
                                      role="radio"
                                      aria-checked={field.value === level}
                                      aria-label={`Connection level ${level} of 5`}
                                      variant={
                                        field.value === level
                                          ? "default"
                                          : "outline"
                                      }
                                      className="rounded-full w-10 h-10 p-0"
                                      onClick={() => field.onChange(level)}
                                    >
                                      {level}
                                    </Button>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="churchConnection.servedBefore"
                            render={({ field }) => (
                              <label className="flex gap-3 rounded-lg border p-4 cursor-pointer">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                Have you served on a team here before?
                              </label>
                            )}
                          />
                        </>
                      )}
                      <TextField
                        form={form}
                        name="churchConnection.previousService"
                        label="Prior serving experience (optional)"
                        multiline
                      />
                      <Heading description="Share your current availability and the kind of serving commitment that feels realistic right now.">
                        Current availability and serving
                      </Heading>
                      <div className="grid md:grid-cols-2 gap-5">
                        <SelectField
                          form={form}
                          name="servingFrequency"
                          label="Serving frequency"
                          options={[
                            "Weekly",
                            "Every other week",
                            "Monthly",
                            "Occasional/events only",
                          ]}
                        />
                        <SelectField
                          form={form}
                          name="availabilityDetails.seasonal"
                          label="Seasonal availability"
                          options={[
                            "Available year-round",
                            "School-year only",
                            "Summer only",
                            "Varies",
                          ]}
                        />
                        {(
                          [
                            ["specialEvents", "Open to special events?"],
                            ["retreats", "Open to overnight retreats?"],
                            ["missionTrips", "Open to mission trips?"],
                            ["projects", "Open to short-term projects?"],
                          ] as const
                        ).map(([name, label]) => (
                          <SelectField
                            key={name}
                            form={form}
                            name={`availabilityDetails.${name}`}
                            label={label}
                            options={[
                              "Yes",
                              "Maybe / discuss",
                              "Not right now",
                            ]}
                          />
                        ))}
                      </div>
                      <MultiSelect
                        form={form}
                        name="availability"
                        options={OPTIONS.availability}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.commitment"
                        label="Serving rhythm"
                        options={[
                          "Ongoing role",
                          "Occasional roles",
                          "A mix of both",
                        ]}
                      />
                      <TextField
                        form={form}
                        name="availabilityDetails.responsibility"
                        label="What serving responsibility feels realistic right now?"
                        multiline
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.durationTheyWillTry"
                        label="How long would you try a new serving role?"
                        options={[
                          "A few weeks",
                          "About 3 months",
                          "This semester",
                          "Through the school year",
                          "About a year",
                          "Open-ended — let's talk",
                        ]}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.capacityThisSeason"
                        label="Can you take more this season?"
                        options={[
                          "I can take something new",
                          "I can keep what I have",
                          "Not this season",
                          "Let's talk",
                        ]}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.currentlyServing"
                        label="Are you currently serving on a team here?"
                        options={["Yes", "No", "Not sure"]}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.alreadyAsked"
                        label="Has someone already asked you to serve?"
                        options={[
                          "No",
                          "Yes — kids",
                          "Yes — worship",
                          "Yes — another team",
                          "Yes — not sure who",
                        ]}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.servingLoadCount"
                        label="How many serving roles are you carrying right now?"
                        options={["None", "One", "Two", "Three or more"]}
                      />
                      <SelectField
                        form={form}
                        name="availabilityDetails.servingLoadFeel"
                        label="How does that load feel?"
                        options={["Fine", "Stretched", "Overloaded"]}
                      />
                    </>
                  )}
                  {submitError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-destructive/10 text-destructive p-3"
                    >
                      {submitError}
                    </p>
                  )}
                </CardContent>
              </Card>
              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((value) => value - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                {stepIndex === stepKeys.length - 1 ? (
                  <Button
                    type="button"
                    disabled={createProfile.isPending || photoUploading}
                    onClick={() => void form.handleSubmit(submit)()}
                  >
                    {createProfile.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Submit profile
                  </Button>
                ) : (
                  <Button type="button" onClick={next}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </AssessmentConfigurationContext.Provider>
      </main>
    </div>
  );
}
