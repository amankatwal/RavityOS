import arcjet, {
  detectBot,
  detectPromptInjection,
  fixedWindow,
  protectSignup,
  shield,
} from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!, 
  rules: [
    shield({
      mode: "LIVE",
    }),
  ]
});

export const ajBasic = aj.withRule(
  fixedWindow({
    characteristics: ["userId"],
    mode: "LIVE",
    window: "60s", 
    max: 100,
  })
)

export const ajExpensive = aj.withRule(
  fixedWindow({
    characteristics: ["userId"],
    mode: "LIVE",
    window: "60s",
    max: 10,
  })
)

export const ajAi = ajExpensive.withRule(
  detectBot({ mode: "LIVE", allow: [] })
)

export const ajAiPrompt = ajAi.withRule(
  detectPromptInjection({ mode: "LIVE" })
)

export const ajSignup = aj.withRule(
  protectSignup({
    rateLimit: {
      mode: "LIVE",
      interval: "10m",
      max: 5,
    },
    bots: {
      mode: "LIVE",
      allow: [],
    },
    email: {
      mode: "LIVE",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    },
  })
)

export const ajNetwork = aj.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "60s",
    max: 20,
  })
)