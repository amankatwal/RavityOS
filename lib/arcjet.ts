import arcjet, {
  detectBot,
  fixedWindow,
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
).withRule(
   detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE", 
      ],
    }),
)