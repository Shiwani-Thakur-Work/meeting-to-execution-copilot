/**
 * sampleTranscripts.js
 * 
 * Curated real-world meeting transcripts representing diverse team dynamics:
 * - Cross-functional product syncs
 * - Engineering sprint planning & architectural debates
 * - Incident post-mortems & technical retrospectives
 * - Executive roadmap alignment
 * 
 * Each transcript includes realistic edge cases:
 * 1. Unassigned chores ("Someone should check Redis memory usage")
 * 2. Vague deadlines ("Let's finish this next week")
 * 3. Confirmed decisions vs speculative proposals
 * 4. Critical open questions requiring clarification
 */

export const SAMPLE_TRANSCRIPTS = [
  {
    id: 'sprint-planning',
    title: 'Sprint 42: Backend Migration & Redis Cache',
    category: 'Engineering / Sprint Planning',
    participants: ['Alex (Tech Lead)', 'Marcus (Senior Backend)', 'Sarah (Frontend Lead)', 'David (DevOps)'],
    date: '2026-10-14',
    text: `Alex (10:00 AM): Alright team, let's lock in our execution plan for the v2 database migration and caching layer. Marcus, where do we stand on the schema changes?
Marcus (10:01 AM): The PostgreSQL schema refactor is ready for review. I will push the pull request and complete the migration script by Thursday, October 16th at 5 PM.
Alex (10:02 AM): Excellent. Sarah, will the frontend API client need updates for the new JSON response format?
Sarah (10:03 AM): Yes, but only for the user session endpoints. I'll take the frontend adapter task and deploy it to staging by Friday morning.
David (10:04 AM): What about Redis cluster sizing? We saw spikes up to 85% memory in staging yesterday during load tests.
Alex (10:05 AM): Good catch David. We definitely need someone to benchmark the Redis eviction policy and double the cluster memory before we touch production.
David (10:06 AM): I can look at the AWS Terraform config, but someone needs to verify if LRU or LFU makes sense for our session keys.
Alex (10:07 AM): Let's make an explicit decision: We will keep PostgreSQL as the primary source of truth and deprecate the MongoDB read-replicas by end of sprint.
Sarah (10:08 AM): Agreed on deprecating MongoDB. That cuts our infrastructure cost by 30%.
Marcus (10:09 AM): What happens if the migration fails mid-way? Do we have an automated zero-downtime rollback script?
Alex (10:10 AM): That's an open question. Marcus and David, let's schedule a 15-minute drill tomorrow to test the rollback procedure.
Marcus (10:11 AM): Sounds good. Someone should also update the developer onboarding doc with the new environment variables sometime next week.`
  },
  {
    id: 'product-launch-sync',
    title: 'Customer Portal 2.0: Pre-Launch Readiness',
    category: 'Product & Go-To-Market',
    participants: ['Elena (Principal PM)', 'Carlos (Design Lead)', 'Rachel (Product Marketing)', 'Vikram (Engineering Manager)'],
    date: '2026-10-15',
    text: `Elena (02:00 PM): Welcome everyone. We have exactly 12 days before the Customer Portal 2.0 public launch. Today we must finalize feature scope and freeze non-essential requests.
Rachel (02:02 PM): From marketing side, we need high-resolution mockups for the launch blog post and email blast. Carlos, can your team deliver those by Monday?
Carlos (02:03 PM): Yes, I will deliver the finalized export assets and promotional UI renders to Rachel by Monday, October 20th at 12:00 PM.
Vikram (02:04 PM): On engineering side, the SSO integration with Okta is 90% complete. However, the custom theme selector is buggy on mobile Safari.
Elena (02:06 PM): Decision: We are officially cutting the custom theme selector from the v2.0 release. It will be pushed to the v2.1 maintenance release.
Vikram (02:07 PM): Understood. I will update the Linear sprint board to remove custom themes from the launch milestone today.
Rachel (02:08 PM): What is our policy regarding existing legacy tier customers? Are we grandfathering their pricing or forcing the migration?
Elena (02:09 PM): We should maybe think about grandfathering them for six months, but finance hasn't signed off on the margin impact yet.
Rachel (02:10 PM): That's a critical blocker. Who is reaching out to CFO Dan to get the definitive sign-off on pricing tiers?
Elena (02:11 PM): I will email Dan today and get the signed pricing policy by tomorrow afternoon.
Carlos (02:12 PM): We might also want to revamp the empty state illustrations soon, but only if design has bandwidth.`
  },
  {
    id: 'incident-postmortem',
    title: 'Incident Post-Mortem: Payment Gateway Timeout (SEV-1)',
    category: 'Operations / Reliability',
    participants: ['Zoe (VP Engineering)', 'Liam (Site Reliability)', 'Priya (Billing Backend Lead)', 'Nate (QA Engineer)'],
    date: '2026-10-16',
    text: `Zoe (11:00 AM): Let's review the root cause and immediate action items from yesterday's 42-minute payment gateway outage.
Liam (11:02 AM): The timeline: At 14:18 UTC, Stripe webhook handling threads were exhausted due to an unhandled TCP timeout during DNS failover.
Priya (11:04 AM): I identified the culprit in the billing microservice. We lacked a circuit breaker on outgoing webhook acknowledgments.
Zoe (11:05 AM): What's the permanent fix?
Priya (11:06 AM): I commit to implementing the resilient circuit breaker pattern with a 2-second timeout in the billing service by Wednesday, October 22nd.
Zoe (11:07 AM): Approved. Decision: All downstream third-party HTTP integrations must enforce a strict maximum timeout of 2.5 seconds with exponential backoff.
Liam (11:08 AM): I will configure Datadog synthetic alerts for Stripe webhook lag and threshold breach alerts by Friday.
Nate (11:09 AM): Can QA get a dedicated chaos testing environment to simulate third-party payment vendor dropouts?
Zoe (11:10 AM): Liam, can DevOps spin up a chaos test harness for Nate before the next billing release?
Liam (11:11 AM): We can look into running Chaos Mesh next sprint, but it depends on cluster capacity.
Priya (11:12 AM): Did any customer transactions permanently fail without idempotency keys? We need someone to audit the ledger discrepancies.`
  },
  {
    id: 'roadmap-strategy',
    title: 'Executive Sync: 2027 AI Automation Strategy',
    category: 'Executive / Strategy',
    participants: ['Sophia (CEO)', 'Julian (Head of Product)', 'Maya (CTO)', 'Arthur (Head of Sales)'],
    date: '2026-10-17',
    text: `Sophia (09:00 AM): Our strategic priority for next year is shifting from reactive customer analytics to proactive autonomous workflows. Julian, summarize the product proposal.
Julian (09:02 AM): We propose allocating 60% of R&D resources in Q1 to our multi-agent execution orchestrator.
Maya (09:04 AM): From an engineering perspective, building autonomous agents requires strict sandboxing and SOC2 Type II compliance guarantees.
Sophia (09:06 AM): Decision: We approve the strategic pivot to the execution orchestrator, conditioned on passing the external security audit.
Arthur (09:07 AM): Enterprise clients are asking for on-premise model hosting options. Can we support private VPC deployments?
Maya (09:09 AM): That remains an open architectural question. I will draft an architectural RFC comparing self-hosted Ollama/vLLM vs Azure OpenAI Private Endpoints by November 1st.
Julian (09:11 AM): Arthur, we need customer discovery interviews with at least 5 Tier-1 banking prospects to validate private cloud demand.
Arthur (09:12 AM): I will schedule and lead 5 enterprise customer interviews before October 31st.
Sophia (09:13 AM): Someone should definitely check our cloud compute budget allocation with the finance team sometime before next board meeting.`
  }
];
