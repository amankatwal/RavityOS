export const PLAN_SLUGS = {
  enterprise: "enterprise_plan",
  scale: "scale_growth_plan",
  builder: "hobby_pro_builder_plan",
  starter: "starter_free_plan",
} as const

export const ALL_PLAN_SLUGS = Object.values(PLAN_SLUGS)