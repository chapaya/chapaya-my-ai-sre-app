// =================================================================
// CONFIG: edit these two lists to make the page yours.
// =================================================================

export type Check = {
  task: string;
  /** The word shown once it's ticked, like a pilot's checklist response. */
  response: string;
};

export type LinkGroup = {
  name: string;
  /** Leave url empty ("") and the page shows a reminder instead of a broken link. */
  links: { label: string; url: string }[];
};

// These are examples: delete the ones you don't need and add your own.
export const CHECKS: Check[] = [
  // Incidents and on-call
  { task: "Review alerts that fired overnight",              response: "Reviewed" },
  { task: "Confirm who is on call in PagerDuty",             response: "Confirmed" },
  { task: "Follow up on open incidents and postmortems",     response: "Followed up" },

  // Health and capacity
  { task: "Check overall service health in Datadog",         response: "Checked" },
  { task: "Look for pods restarting or stuck in Kubernetes", response: "Checked" },
  { task: "Check disk, CPU and memory on busy hosts",        response: "Checked" },
  { task: "Look for new errors in Sentry",                   response: "Reviewed" },

  // Security
  { task: "Review new security findings in Wiz",             response: "Reviewed" },
  { task: "Look for certificates expiring in 30 days",       response: "Checked" },

  // Builds, deploys and data
  { task: "Go through failed CI/CD pipelines",               response: "Reviewed" },
  { task: "Check that Argo CD apps are synced and healthy",  response: "Synced" },
  { task: "Make sure last night's backups finished",         response: "Verified" },

  // Cost and housekeeping
  { task: "Look for cloud cost spikes since yesterday",      response: "Checked" },
  { task: "Triage new tickets",                              response: "Triaged" },
  { task: "Review pull requests waiting on you",             response: "Reviewed" },
  { task: "Update the team board",                           response: "Updated" },
  { task: "Write handover notes",                            response: "Written" },
];

// Tools at the same address for everyone have a URL already.
// Self-hosted tools (Grafana, Jenkins...) live at your own address,
// so fill in their url.
export const LINK_GROUPS: LinkGroup[] = [
  {
    name: "Monitoring",
    links: [
      { label: "Datadog",    url: "https://app.datadoghq.com" },
      { label: "Grafana",    url: "" },
      { label: "Prometheus", url: "" },
      { label: "Sentry",     url: "https://sentry.io" },
      { label: "Kibana",     url: "" },
    ],
  },
  {
    name: "Incidents and on-call",
    links: [
      { label: "PagerDuty",   url: "https://app.pagerduty.com" },
      { label: "Opsgenie",    url: "https://app.opsgenie.com" },
      { label: "Status page", url: "" },
    ],
  },
  {
    name: "Security",
    links: [
      { label: "Wiz",              url: "https://app.wiz.io" },
      { label: "Snyk",             url: "https://app.snyk.io" },
    ],
  },
  {
    name: "Cloud",
    links: [
      { label: "Google Cloud console", url: "https://console.cloud.google.com" },
      { label: "Azure portal",         url: "https://portal.azure.com" },
    ],
  },
  {
    name: "Builds and deploys",
    links: [
      { label: "GitHub",  url: "https://github.com" },
      { label: "GitLab",  url: "https://gitlab.com" },
      { label: "Jenkins", url: "" },
      { label: "Argo CD", url: "" },
    ],
  },
  {
    name: "Work",
    links: [
      { label: "Jira",       url: "" },
      { label: "Runbooks",   url: "" },
      { label: "Team board", url: "" },
    ],
  },
];
