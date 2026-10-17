/**
 * sampleTranscripts.js
 * 
 * Curated real-world meeting transcripts representing diverse team dynamics:
 * - Cross-functional product syncs
 * - Engineering sprint planning & architectural debates
 * - Incident post-mortems & technical retrospectives
 * - Executive roadmap alignment
 * 
 * Uses realistic Indian tech team & diverse names:
 * (Aarav, Rohan, Priya, Vikram, Ananya, Karan, Neha, Aditya, Divya, Arjun, Sneha, Nikhil, Ritu, Kabir, Maya, Rahul)
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
    title: 'Sprint 42: PayCore Migration & Redis Cache',
    category: 'Engineering / Sprint Planning',
    participants: ['Aarav (Tech Lead)', 'Rohan (Senior Backend)', 'Priya (Frontend Lead)', 'Vikram (DevOps)'],
    date: '2026-10-14',
    text: `Aarav (10:00 AM): Alright team, let's lock in our execution plan for the v2 PayCore database migration and caching layer. Rohan, where do we stand on the schema changes?
Rohan (10:01 AM): The PostgreSQL schema refactor is ready for review. I will push the pull request and complete the migration script by Thursday, October 16th at 5 PM.
Aarav (10:02 AM): Excellent. Priya, will the frontend API client need updates for the new JSON response format?
Priya (10:03 AM): Yes, but only for the user session endpoints. I'll take the frontend adapter task and deploy it to staging by Friday morning.
Vikram (10:04 AM): What about Redis cluster sizing? We saw spikes up to 85% memory in staging yesterday during load tests.
Aarav (10:05 AM): Good catch Vikram. We definitely need someone to benchmark the Redis eviction policy and double the cluster memory before we touch production.
Vikram (10:06 AM): I can look at the AWS Terraform config, but someone needs to verify if LRU or LFU makes sense for our session keys.
Aarav (10:07 AM): Let's make an explicit decision: We will keep PostgreSQL as the primary source of truth and deprecate the MongoDB read-replicas by end of sprint.
Priya (10:08 AM): Agreed on deprecating MongoDB. That cuts our infrastructure cost by 30%.
Rohan (10:09 AM): What happens if the migration fails mid-way? Do we have an automated zero-downtime rollback script?
Aarav (10:10 AM): That's an open question. Rohan and Vikram, let's schedule a 15-minute drill tomorrow to test the rollback procedure.
Rohan (10:11 AM): Sounds good. Someone should also update the developer onboarding doc with the new environment variables sometime next week.`
  },
  {
    id: 'product-launch-sync',
    title: 'Customer App 2.0: Diwali Launch Readiness',
    category: 'Product & Go-To-Market',
    participants: ['Ananya (Principal PM)', 'Karan (Design Lead)', 'Neha (Product Marketing)', 'Aditya (Engineering Manager)'],
    date: '2026-10-15',
    text: `Ananya (02:00 PM): Welcome everyone. We have exactly 12 days before the Customer App 2.0 public launch. Today we must finalize feature scope and freeze non-essential requests.
Neha (02:02 PM): From marketing side, we need high-resolution mockups for the launch blog post and festive campaign banner. Karan, can your team deliver those by Monday?
Karan (02:03 PM): Yes, I will deliver the finalized export assets and promotional UI renders to Neha by Monday, October 20th at 12:00 PM.
Aditya (02:04 PM): On engineering side, the UPI AutoPay integration is 90% complete. However, the custom theme selector is buggy on mobile Safari and low-end Android.
Ananya (02:06 PM): Decision: We are officially cutting the custom theme selector from the v2.0 release. It will be pushed to the v2.1 maintenance release.
Aditya (02:07 PM): Understood. I will update the Linear sprint board to remove custom themes from the launch milestone today.
Neha (02:08 PM): What is our policy regarding existing legacy tier customers? Are we grandfathering their pricing or forcing the migration?
Ananya (02:09 PM): We should maybe think about grandfathering them for six months, but finance hasn't signed off on the margin impact yet.
Neha (02:10 PM): That's a critical blocker. Who is reaching out to CFO Sanjay to get the definitive sign-off on pricing tiers?
Ananya (02:11 PM): I will email Sanjay today and get the signed pricing policy by tomorrow afternoon.
Karan (02:12 PM): We might also want to revamp the empty state illustrations soon, but only if design has bandwidth.`
  },
  {
    id: 'incident-postmortem',
    title: 'Incident Post-Mortem: Payment Gateway Timeout (SEV-1)',
    category: 'Operations / Reliability',
    participants: ['Divya (VP Engineering)', 'Arjun (Site Reliability)', 'Sneha (Billing Microservices Lead)', 'Nikhil (QA Lead)'],
    date: '2026-10-16',
    text: `Divya (11:00 AM): Let's review the root cause and immediate action items from yesterday's 42-minute payment gateway outage during peak festive sale.
Arjun (11:02 AM): The timeline: At 14:18 IST, Razorpay webhook handling threads were exhausted due to an unhandled TCP timeout during DNS failover.
Sneha (11:04 AM): I identified the culprit in the billing microservice. We lacked a circuit breaker on outgoing webhook acknowledgments.
Divya (11:05 AM): What's the permanent fix?
Sneha (11:06 AM): I commit to implementing the resilient circuit breaker pattern with a 2-second timeout in the billing service by Wednesday, October 22nd.
Divya (11:07 AM): Approved. Decision: All downstream third-party HTTP integrations must enforce a strict maximum timeout of 2.5 seconds with exponential backoff.
Arjun (11:08 AM): I will configure Datadog synthetic alerts for webhook lag and latency breach alerts by Friday.
Nikhil (11:09 AM): Can QA get a dedicated chaos testing environment to simulate third-party payment vendor dropouts?
Divya (11:10 AM): Arjun, can DevOps spin up a chaos test harness for Nikhil before the next billing release?
Arjun (11:11 AM): We can look into running Chaos Mesh next sprint, but it depends on cluster capacity.
Sneha (11:12 AM): Did any customer transactions permanently fail without idempotency keys? We need someone to audit the ledger discrepancies.`
  },
  {
    id: 'roadmap-strategy',
    title: 'Executive Sync: 2027 Agentic AI Strategy',
    category: 'Executive / Strategy',
    participants: ['Ritu (Founder & CEO)', 'Kabir (Head of Product)', 'Maya (CTO)', 'Rahul (Head of Business)'],
    date: '2026-10-17',
    text: `Ritu (09:00 AM): Our strategic priority for next year is shifting from reactive customer analytics to proactive autonomous workflows. Kabir, summarize the product proposal.
Kabir (09:02 AM): We propose allocating 60% of R&D resources in Q1 to our multi-agent execution orchestrator.
Maya (09:04 AM): From an engineering perspective, building autonomous agents requires strict sandboxing and DPDP Act compliance guarantees.
Ritu (09:06 AM): Decision: We approve the strategic pivot to the execution orchestrator, conditioned on passing the external security audit.
Rahul (09:07 AM): Enterprise clients in banking are asking for on-premise model hosting options. Can we support private VPC deployments?
Maya (09:09 AM): That remains an open architectural question. I will draft an architectural RFC comparing self-hosted Ollama/vLLM vs Azure OpenAI Private Endpoints by November 1st.
Kabir (09:11 AM): Rahul, we need customer discovery interviews with at least 5 Tier-1 private bank prospects to validate private cloud demand.
Rahul (09:12 AM): I will schedule and lead 5 enterprise customer interviews before October 31st.
Ritu (09:13 AM): Someone should definitely check our cloud compute budget allocation with the finance team sometime before next board meeting.`
  }
];
