import {
  BookOpen,
  Compass,
  Cross,
  Network,
  Orbit,
  Sparkles,
} from "lucide-react";

export const pathway = [
  {
    number: "01",
    icon: Cross,
    title: "Pray",
    description:
      "Begin with prayer. Ask God to help you see people as he sees them, not simply as open positions to fill.",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Set Up",
    description:
      "Shape a Ministry Profile around your church, your teams, and the places people can meaningfully contribute.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Discover",
    description:
      "Invite people to reflect on their story, gifts, passions, experience, rhythms, and the way they are growing.",
  },
  {
    number: "04",
    icon: Compass,
    title: "Discern",
    description:
      "Use the profile as a doorway into a real conversation about calling, readiness, capacity, and the season someone is in.",
  },
  {
    number: "05",
    icon: Network,
    title: "Connect",
    description:
      "Explore ministry opportunities together and find a place where a person and a team can serve one another well.",
  },
  {
    number: "06",
    icon: Orbit,
    title: "Develop",
    description:
      "Follow up after someone begins. Notice what is healthy, encourage growth, and make room for the next step.",
  },
];

export const dimensions = [
  ["Spiritual Gifts", "How has the Holy Spirit equipped me?"],
  ["How You Minister", "How do I tend to contribute to the mission of the Church?"],
  ["How You Tend to Operate", "How do I naturally relate, decide, organize, and work with others?"],
  ["Passions", "Who or what has God placed on my heart?"],
  ["Skills & Experience", "What has God already developed in me?"],
  ["Spiritual Health", "How am I doing in my relationship with Christ?"],
  ["Availability & Current Season", "What commitment is realistic and healthy right now?"],
  ["Ministry Interests", "Where am I drawn toward serving?"],
];

export const problemCards = [
  ["The Same People Keep Carrying the Load", "Faithful volunteers often carry most of the ministry load while other gifts and abilities remain unseen."],
  ["Good Intentions Need a Starting Point", "Many people are willing to serve, but leaders and members are unsure where a healthy conversation should begin."],
  ["People and Seasons Change", "A role that once fit may not match someone’s gifts, capacity, or current season anymore."],
];

export const leaderBenefits = [
  "View completed Ministry Profiles",
  "Search by gifts and passions",
  "Understand availability",
  "Notice pathways for growth",
  "Identify emerging leaders",
  "Discover overlooked abilities",
  "Track profile completion",
  "Build healthier ministry teams",
  "Follow development over time",
];

export const partfinderBenefits = [
  {
    eyebrow: "For pastors",
    title: "Prepare for the conversations that matter.",
    description:
      "PartFinder helps pastors see patterns across adult Ministry Profiles, think through a ministry need, and enter a conversation with better questions.",
    points: [
      "Explore church-wide serving patterns",
      "Notice people worth following up with",
      "Prepare thoughtful leadership conversations",
    ],
  },
  {
    eyebrow: "For pastors and ministry leaders",
    title: "Move from a ministry need to a formation conversation.",
    description:
      "Describe the kind of growth or ministry need you are discerning and PartFinder surfaces relevant, verified profile signals so you know where to begin.",
    points: [
      "Clarify the need, rhythms, and current season",
      "Review conversation themes from shared evidence",
      "Keep willingness, relationship, and growth at the center",
    ],
  },
];

export const sampleProfiles = [
  {
    name: "Sarah",
    pathway: "Adult Ministry Profile",
    age: "In conversation",
    initials: "S",
    description: "Encouragement, care, and a steady presence that helps people feel welcomed and connected.",
    theme: "adult",
    image: "/sample-profile-sarah-community.jpg",
  },
  {
    name: "Leah",
    pathway: "Discover Profile",
    age: "Ages 6–8",
    initials: "L",
    description: "Discovering joy, kindness, and the ways she can help her church family.",
    theme: "discover",
    image: "/sample-profile-leah.jpg",
  },
  {
    name: "Marcus",
    pathway: "Explore Profile",
    age: "Ages 9–12",
    initials: "M",
    description: "Exploring curiosity, courage, and how his questions can help his church family grow.",
    theme: "explore",
    image: "/sample-profile-marcus.jpg",
  },
  {
    name: "Jordan",
    pathway: "Develop Profile",
    age: "Ages 13–17",
    initials: "J",
    description: "Growing gifts, meaningful interests, and a next step toward serving the Body of Christ.",
    theme: "develop",
    image: "/sample-profile-jordan.jpg",
  },
];

export const sampleProfileDetails = [
  {
    name: "Sarah",
    pathway: "Adult Ministry Profile",
    age: "In conversation",
    initials: "S",
    theme: "adult",
    image: "/sample-profile-sarah-community.jpg",
    intro: "A fuller picture before the next conversation.",
    lead: "Start with a question.",
    fields: [
      { label: "Top spiritual gifts", values: ["Encouragement", "Mercy", "Helps"] },
      { label: "How she tends to minister", text: "Caring for people over time" },
      { label: "How she tends to operate", values: ["Relational", "Reflective", "Organized", "People-centered"] },
      { label: "Passions", values: ["Young Adults", "People in Crisis", "New Believers"] },
    ],
    notes: [
      "Sarah may bring a gift for encouragement and organization.",
      "Her current availability makes a weekly mentoring role worth exploring.",
      "A leader can ask what support would help her take a healthy next step.",
    ],
    environments: ["Care Ministry", "Discipleship", "Small Groups", "Hospitality"],
    closing: "Sarah’s profile does not decide for her. It helps a pastor enter the conversation prepared to listen.",
  },
  {
    name: "Leah",
    pathway: "Discover Profile",
    age: "Ages 6–8",
    initials: "L",
    theme: "discover",
    image: "/sample-profile-leah.jpg",
    intro: "A gentle way to notice how a child is growing and helping.",
    lead: "Notice what brings her joy.",
    fields: [
      { label: "Things she enjoys", values: ["Making things", "Stories", "Singing"] },
      { label: "How she might help", text: "Welcoming people and noticing who needs care" },
      { label: "What grown-ups notice", values: ["Kind", "Curious", "Quick to encourage"] },
      { label: "A next conversation", values: ["Where she feels brave", "Who helps her grow"] },
    ],
    notes: [
      "Leah seems energized when she can make someone feel included.",
      "Her answers give a trusted grown-up a starting point, not a label.",
      "A leader can invite her to try a small, supported way to help.",
    ],
    environments: ["Kids Welcome", "Worship Arts", "Small Groups", "Helping a Friend"],
    closing: "Leah’s profile gives adults better questions to ask while leaving room for play, growth, and her own words.",
  },
  {
    name: "Marcus",
    pathway: "Explore Profile",
    age: "Ages 9–12",
    initials: "M",
    theme: "explore",
    image: "/sample-profile-marcus.jpg",
    intro: "A snapshot of the questions, strengths, and interests he is exploring.",
    lead: "Follow the curiosity.",
    fields: [
      { label: "Strengths showing up", values: ["Creative", "Courageous", "Encouraging"] },
      { label: "How he tends to contribute", text: "Bringing energy and ideas to a group" },
      { label: "How he tends to operate", values: ["Imaginative", "Collaborative", "Adventurous", "Observant"] },
      { label: "Interests to explore", values: ["Media", "Games", "Welcome", "Helping younger kids"] },
    ],
    notes: [
      "Marcus may thrive when he can ask questions and help shape the idea.",
      "He appears ready for responsibility that comes with a clear, supportive guide.",
      "A leader can ask which part he would most like to try first.",
    ],
    environments: ["Tech & Media", "Kids Ministry", "Welcome Team", "Creative Projects"],
    closing: "Marcus’s profile creates a safe starting point for trying something meaningful without rushing him into a role.",
  },
  {
    name: "Jordan",
    pathway: "Develop Profile",
    age: "Ages 13–17",
    initials: "J",
    theme: "develop",
    image: "/sample-profile-jordan.jpg",
    intro: "A reflection on growing gifts, meaningful interests, and a next step.",
    lead: "Make room for the next step.",
    fields: [
      { label: "Gifts to explore", values: ["Leadership", "Wisdom", "Service"] },
      { label: "How Jordan tends to minister", text: "Building trust and taking thoughtful initiative" },
      { label: "How Jordan tends to operate", values: ["Reflective", "Collaborative", "Determined", "People-aware"] },
      { label: "Passions", values: ["Students", "Justice", "Prayer", "Belonging"] },
    ],
    notes: [
      "Jordan may be ready to lead a small piece of ministry with coaching nearby.",
      "The profile points toward a conversation about capacity, support, and timing.",
      "A leader can ask what kind of responsibility would feel like a healthy stretch.",
    ],
    environments: ["Student Leadership", "Prayer", "Mentoring", "Service Projects"],
    closing: "Jordan’s profile supports a real development conversation—one that honors both calling and the season Jordan is in.",
  },
];
