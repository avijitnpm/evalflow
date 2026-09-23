export type SidebarNotification = {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  link?: string;
  linkTitle?: string;
  linkImage?: {
    alt: string;
    src: string;
  };
  ttlMs?: number;
};

export const SIDEBAR_NOTIFICATIONS: SidebarNotification[] = [
  {
    id: "lw5-1",
    title: "Launch Week: Day 1",
    description:
      "Run experiments inside GitHub Actions to test every PR against an EvalFlow dataset.",
    link: "https://langfuse.com/changelog/2026-05-25-experiment-ci-cd-gates",
    linkTitle: "Learn more",
    createdAt: "2026-05-25",
  },
  {
    id: "lw5-2",
    title: "Launch Week: Day 2",
    description:
      "EvalFlow agent skill turns EvalFlow into a headless platform to evaluate, query and instrument your application.",
    link: "https://langfuse.com/changelog/2026-05-26-langfuse-agent-skill",
    linkTitle: "Learn more",
    createdAt: "2026-05-26",
  },
  {
    id: "lw5-3",
    title: "Launch Week: Day 3",
    description: "Fast full-text search on observation I/O via the UI and API",
    link: "https://langfuse.com/changelog/2026-05-27-clickhouse-full-text-search-fast-mode",
    linkTitle: "Learn more",
    createdAt: "2026-05-27",
  },
  {
    id: "lw5-4",
    title: "Launch Week: Day 4",
    description:
      "Code evaluators let you score observations and experiments with Python/TypeScript checks.",
    link: "https://langfuse.com/changelog/2026-05-28-code-evaluators",
    linkTitle: "Learn more",
    createdAt: "2026-05-28",
  },
  {
    id: "lw5-5",
    title: "Launch Week: Day 5",
    description:
      "EvalFlow MCP now covers observations, metrics, scores, datasets, comments, and more.",
    link: "https://langfuse.com/changelog/2026-05-29-mcp-update",
    linkTitle: "Learn more",
    createdAt: "2026-05-29",
  },
  {
    id: "github-star",
    title: "Star EvalFlow",
    description:
      "See the latest releases and help grow the community on GitHub",
    link: "https://github.com/avijitnpm/evalflow",
    linkImage: {
      alt: "EvalFlow GitHub stars",
      src: "https://img.shields.io/github/stars/avijitnpm/evalflow?label=evalflow&style=social",
    },
  },
];
