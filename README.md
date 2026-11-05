# RavityOS

RavityOS is an AI-agent workspace for building workflows that can research, use connected tools, and move repeatable tasks forward.

[Open the live app](https://ravity-os.vercel.app)

## What it includes

- Create and configure AI agents
- Connect tools and integrations
- Review agent runs, activity, and outputs
- Track execution status from a dashboard

## Tech stack

Next.js · React · TypeScript · Prisma · PostgreSQL · Clerk · AI SDK

## Local development

This repository uses pnpm.

```bash
pnpm install
pnpm dev
```

The app depends on external services for authentication, database access, and AI/tool integrations. Configure the credentials required by the services you use before testing those flows.

For a production build, run:

```bash
pnpm build
pnpm start
```
