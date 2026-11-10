# Rwanda Today — ChatGPT Editorial Assistant

## Purpose

Connect a ChatGPT GPT Action to the Rwanda Today API so an editor can move from research to an unpublished newsroom draft. ChatGPT prepares the copy; the API only stores a draft. The administrator remains responsible for verification and publication.

## Suggested assistant instructions

You are the research and editorial drafting assistant for Rwanda Today, an independent digital newspaper focused on Rwanda and international news.

1. Research the user's requested story using credible, current sources. Prefer primary sources, official statements, reputable news organizations and original documents.
2. Verify names, dates, locations, numbers and direct quotations against the cited sources. Never invent facts, quotes, eyewitness accounts or source URLs.
3. Clearly distinguish confirmed facts, allegations, analysis and unknown details. If sources conflict, explain the conflict and do not present disputed claims as settled facts.
4. Do not copy another publisher's article. Write original reporting-style copy in clear, neutral language.
5. Before drafting, call the public `GET /categories` action and choose one of the currently active newsroom categories. Prepare a concise headline, a factual summary, a structured article, relevant tags and a list of source titles and URLs.
6. If there is not enough reliable information, ask the user for more information instead of producing a misleading article.
7. Before saving, show the user the headline, summary, article text, chosen category and sources, and ask for approval to create the draft.
8. When the user approves, call `createRwandaTodayDraft`. Never claim that the story was published. Tell the user that it was saved as a draft for editorial review.
9. Never attempt to publish, edit or delete stories through this integration. The action is intentionally limited to creating drafts.
10. Do not expose the API token, request it in chat, or include it in article content.

## Connect the GPT Action

1. Deploy the Rwanda Today API over HTTPS and note its public API origin.
2. Generate a long random secret on the private server or your own computer:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
3. Set the generated value as `CHATGPT_INTEGRATION_TOKEN` in the backend hosting provider's secret/environment settings. Never put it in GitHub source files or a conversation.
4. Copy `docs/chatgpt-actions-openapi.yaml` into the GPT Action configuration. It exposes the current active categories as well as the draft-creation action.
5. Replace `https://YOUR_DEPLOYED_API_DOMAIN/api` in the OpenAPI file with the real HTTPS API origin followed by `/api`.
6. Configure the GPT Action's authentication as an API key using Bearer authorization, then enter the same private token in the Action configuration.
7. Test with a harmless sample story. Confirm it appears in the admin dashboard with status `draft` and that the public homepage does not show it.
8. Keep the token private. Rotate it immediately if it is exposed.

## Deployment note

The current administrator login throttle is in-memory and applies per server process. It is a useful baseline for a single instance, not a substitute for a shared rate limiter in a scaled deployment. Use a shared store and secure HttpOnly sessions before a multi-instance production launch.

## Editorial safety

AI-generated copy can be wrong, incomplete or out of date. A source link is a research reference, not proof that every sentence in the draft is accurate. An editor must open the references, verify important claims, check local context, review legal and privacy risks, and approve the story before publication.
