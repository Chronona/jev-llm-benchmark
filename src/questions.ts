import { choice, noul, score } from "@typesafe-ai/sdk";
import type { BenchmarkQuestion } from "./types.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export function buildQuestionsFromInput(state: string): BenchmarkQuestion {
  return {
    id: `custom-${slugify(state)}`,
    state,
    jevQuestions: {
      sentiment: choice("What is the sentiment of this message?", {
        positive: "The user expresses happiness, praise, or satisfaction.",
        neutral: "The user states facts without strong emotion.",
        negative: "The user expresses dissatisfaction, anger, or criticism.",
      }),
      category: choice("Which department should handle this request?", {
        billing: "Payments, invoicing, refunds, charges",
        technical: "Bugs, outages, integrations, errors",
        sales: "Pricing, upgrades, new accounts",
        other: "Does not fit the above categories",
      }),
      urgency: score("How urgent is this incident?", [
        "Low urgency: cosmetic or minor inconvenience",
        "Medium urgency: partial feature degradation",
        "High urgency: major business impact, many users affected",
      ]),
    },
    llmPrompt: `State: "${state}"

Return JSON with these fields:
- sentiment: one of [positive, neutral, negative]
- category: one of [billing, technical, sales, other]
- urgency: a number from 0 (low) to 2 (high)

Respond only with valid JSON.`,
  };
}

export const questions: BenchmarkQuestion[] = [
  {
    id: "sentiment",
    state: "I absolutely love the new dashboard, it is so fast and intuitive!",
    jevQuestions: {
      sentiment: choice("What is the sentiment of this message?", {
        positive: "The user expresses happiness, praise, or satisfaction.",
        neutral: "The user states facts without strong emotion.",
        negative: "The user expresses dissatisfaction, anger, or criticism.",
      }),
    },
    llmPrompt: `State: "I absolutely love the new dashboard, it is so fast and intuitive!"

Return JSON with one field:
- sentiment: one of [positive, neutral, negative]

Respond only with valid JSON.`,
    expected: { sentiment: "positive" },
  },
  {
    id: "category",
    state: "I was charged twice this month. Please refund the duplicate payment.",
    jevQuestions: {
      category: choice("Which department should handle this request?", {
        billing: "Payments, invoicing, refunds, charges",
        technical: "Bugs, outages, integrations, errors",
        sales: "Pricing, upgrades, new accounts",
        other: "Does not fit the above categories",
      }),
    },
    llmPrompt: `State: "I was charged twice this month. Please refund the duplicate payment."

Return JSON with one field:
- category: one of [billing, technical, sales, other]

Respond only with valid JSON.`,
    expected: { category: "billing" },
  },
  {
    id: "urgency",
    state: "The production database is down and customers cannot complete checkout.",
    jevQuestions: {
      urgency: score("How urgent is this incident?", [
        "Low urgency: cosmetic or minor inconvenience",
        "Medium urgency: partial feature degradation",
        "High urgency: major business impact, many users affected",
      ]),
    },
    llmPrompt: `State: "The production database is down and customers cannot complete checkout."

Return JSON with one field:
- urgency: a number from 0 (low) to 2 (high)

Respond only with valid JSON.`,
    expected: { urgency: 2 },
  },
  {
    id: "intent",
    state: "Can I upgrade my plan to include more users?",
    jevQuestions: {
      intent: choice("What is the user's intent?", {
        upgrade: "The user wants to upgrade or expand their plan.",
        cancel: "The user wants to cancel or downgrade.",
        inquiry: "The user asks a general question.",
        complaint: "The user is complaining about something.",
      }),
    },
    llmPrompt: `State: "Can I upgrade my plan to include more users?"

Return JSON with one field:
- intent: one of [upgrade, cancel, inquiry, complaint]

Respond only with valid JSON.`,
    expected: { intent: "upgrade" },
  },
  {
    id: "spam",
    state: "Click here NOW to win a free iPhone!!! Limited time only!!!",
    jevQuestions: {
      is_spam: noul("Is this message spam or unwanted promotion?", {
        true: "The message is unsolicited, uses excessive urgency, or is a scam.",
        false: "The message is legitimate communication.",
      }),
    },
    llmPrompt: `State: "Click here NOW to win a free iPhone!!! Limited time only!!!"

Return JSON with one field:
- is_spam: boolean

Respond only with valid JSON.`,
    expected: { is_spam: true },
  },
  {
    id: "priority",
    state: "My monthly report export is taking longer than usual.",
    jevQuestions: {
      priority: choice("What is the priority of this ticket?", {
        low: "Minor inconvenience, no immediate business impact. Example: a typo in a footer label.",
        medium: "Some workflow impact but workarounds exist. Example: a monthly report export is slower than usual.",
        high: "Significant workflow impact, needs attention soon. Example: customers cannot download invoices.",
        urgent: "Critical outage or severe business impact. Example: production checkout is completely down.",
      }),
    },
    llmPrompt: `State: "My monthly report export is taking longer than usual."

Classify the priority of this ticket into one of [low, medium, high, urgent]. Use these definitions:
- low: Minor inconvenience, no immediate business impact. Example: a typo in a footer label.
- medium: Some workflow impact but workarounds exist. Example: a monthly report export is slower than usual.
- high: Significant workflow impact, needs attention soon. Example: customers cannot download invoices.
- urgent: Critical outage or severe business impact. Example: production checkout is completely down.

Return JSON with one field:
- priority: one of [low, medium, high, urgent]

Respond only with valid JSON.`,
    expected: { priority: "medium" },
  },
  {
    id: "feedback_type",
    state: "Dark mode would be a great addition to the mobile app.",
    jevQuestions: {
      feedback_type: choice("What kind of feedback is this?", {
        feature_request: "The user suggests a new feature or improvement.",
        bug: "The user reports something broken.",
        praise: "The user expresses satisfaction.",
        complaint: "The user expresses dissatisfaction.",
      }),
    },
    llmPrompt: `State: "Dark mode would be a great addition to the mobile app."

Return JSON with one field:
- feedback_type: one of [feature_request, bug, praise, complaint]

Respond only with valid JSON.`,
    expected: { feedback_type: "feature_request" },
  },
  {
    id: "language",
    state: "Bonjour, je ne peux pas me connecter à mon compte.",
    jevQuestions: {
      language: choice("What language is this message written in?", {
        english: "The message is in English.",
        french: "The message is in French.",
        spanish: "The message is in Spanish.",
        german: "The message is in German.",
        other: "Another language.",
      }),
    },
    llmPrompt: `State: "Bonjour, je ne peux pas me connecter à mon compte."

Return JSON with one field:
- language: one of [english, french, spanish, german, other]

Respond only with valid JSON.`,
    expected: { language: "french" },
  },
  {
    id: "semantic_match",
    state: "The payment failed. The transaction did not go through.",
    jevQuestions: {
      same_meaning: noul("Do the two sentences express the same meaning?", {
        true: "The two sentences are semantically equivalent.",
        false: "The sentences have different meanings.",
      }),
    },
    llmPrompt: `State: "The payment failed. The transaction did not go through."

Return JSON with one field:
- same_meaning: boolean

Respond only with valid JSON.`,
    expected: { same_meaning: true },
  },
  {
    id: "risk",
    state: "Let's store user passwords in plain text temporarily so support can debug logins.",
    jevQuestions: {
      risk_level: score("How risky is this proposal?", [
        "Low risk: acceptable security practice.",
        "Medium risk: some concerns but manageable.",
        "High risk: severe security violation.",
      ]),
    },
    llmPrompt: `State: "Let's store user passwords in plain text temporarily so support can debug logins."

Return JSON with one field:
- risk_level: a number from 0 (low) to 2 (high)

Respond only with valid JSON.`,
    expected: { risk_level: 2 },
  },
];
