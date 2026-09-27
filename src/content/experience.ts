import { near, places } from "./places";
import type { Gym } from "./types";

// Remote jobs sit at home base in Westwood. Westwood spots are spread out
// wider than downtown ones because the map squeezes the suburbs.
export const gyms: Gym[] = [
  {
    kind: "gym",
    slug: "aws",
    org: "Amazon Web Services (AWS)",
    location: "Seaport, Boston",
    roles: [
      {
        title: "Software Development Engineer Intern",
        team: "Elastic Block Store (EBS) Encryption",
        start: "2026-06",
        end: "2026-08",
        bullets: [
          "Re-architected a C++ disk-encryption service for static stability by removing its runtime dependency on the key service (KMS), so encrypted volumes can recover after a reboot with no network call, even when KMS is down.",
          "Benchmarked two NitroTPM key-sealing designs and shipped the winner: AES-256-GCM envelope encryption sealed to measured boot state. Worst-case recovery of a host's 8,000+ volume keys went from 3.3 min to about 30 ms.",
          "Implemented key sealing, wrapping, and root-key persistence as asynchronous state machines, validated with a Go integration suite that spins up EC2 Nitro instances to test recovery without KMS, TPM failure, and firmware tampering.",
        ],
      },
    ],
    stack: ["cpp", "go", "aws", "tpm"],
    where: places.awsSeaport,
  },
  {
    kind: "gym",
    slug: "philips",
    org: "Philips",
    location: "Cambridge, MA",
    roles: [
      {
        title: "Software Development Engineer Co-op",
        start: "2026-01",
        end: "2026-05",
        bullets: [
          "Architected a GitHub Actions orchestrator to automate migrating 15+ Azure DevOps repositories, coordinating 7 sub-workflows for repo mirroring, AI-assisted pipeline conversion, secrets injection, and variable migration.",
          "Built a git-tfs pipeline for legacy TFVC repositories the Azure DevOps importer couldn't handle, rewriting large binaries to Git LFS and running a daily REST API sync to keep branches current through cutover.",
          "Replaced long-lived personal access tokens across 25+ CI/CD pipelines with short-lived GitHub App and Azure Service Principal (OIDC) tokens generated on demand via PowerShell, so there's nothing to rotate by hand and no static secret to leak.",
        ],
      },
    ],
    stack: ["github-actions", "azure-devops", "powershell", "git"],
    where: places.philips,
  },
  {
    kind: "gym",
    slug: "tetracorp",
    org: "Tetracorp",
    location: "Remote",
    roles: [
      {
        title: "Software Engineer",
        team: "Bluffs",
        start: "2026-01",
        end: "2026-05",
        bullets: [
          "Owned the wallet and payments backend for Bluffs on Convex (TypeScript). Designed a three-balance ledger (deposits, withdrawable winnings, holds) where every hold remembers where its money came from, so only winnings can ever be withdrawn.",
          "Designed the withdrawal pipeline so users never lose money when the payout API fails: debit first, idempotent payout requests keyed to our own transaction ID, a compensating re-credit on every failure path, and webhooks matched by provider ID.",
          "Built daily deposit limits that parallel checkouts can't double-spend, plus chargeback recovery that claws back money locked in live games once they settle.",
          "Built responsible-gaming and privacy features: self-exclusion breaks that take effect mid-game, CCPA data export and deletion requests, Do-Not-Sell with Global Privacy Control support, and the app's original KYC integration.",
          "Shipped client features in Flutter, then React Native after the app migrated. #2 contributor on a team of about 7 engineers.",
        ],
      },
    ],
    stack: ["typescript", "convex", "flutter", "dart", "react-native"],
    where: near(places.westwood, -1500, 1650),
  },
  {
    kind: "gym",
    slug: "khoury",
    org: "Khoury College of Computer Sciences",
    location: "Northeastern University, Boston",
    roles: [
      {
        title: "Teaching Assistant, Object-Oriented Design (CS 3100)",
        start: "2025-09",
        end: "2025-12",
        bullets: [
          "Led lab sessions and office hours 6 hours a week for 400+ students: encapsulation, inheritance, polymorphism, abstraction, MVC, and design patterns in Java.",
        ],
      },
      {
        title: "Teaching Assistant, Discrete Structures (CS 1800)",
        start: "2025-06",
        end: "2025-08",
        bullets: [
          "Held office hours for 70+ students: graph theory and traversals, sorting analysis, complexity, combinatorics, probability, and proofs.",
        ],
      },
    ],
    stack: ["java"],
    where: near(places.northeastern, 120, -330),
  },
  {
    kind: "gym",
    slug: "outamation",
    org: "Outamation",
    location: "Remote",
    roles: [
      {
        title: "AI Automation Extern",
        start: "2025-05",
        end: "2025-07",
        bullets: [
          "Built a hybrid RAG pipeline with LlamaIndex, combining dense retrieval (HuggingFace e5-large-v2) with BM25 keyword search, which doubled retrieval accuracy on complex mortgage documents. Ran Mistral-7B locally on llama.cpp.",
          "Built NLP and computer vision pipelines (PyMuPDF, OCR) for document extraction and classification.",
          "Benchmarked open-source LLMs (Mistral 7B, Phi-2, TinyLlama) for document processing and wrote up optimization and deployment recommendations.",
        ],
      },
    ],
    stack: ["python", "llamaindex"],
    where: near(places.westwood, -3100, 3500),
  },
  {
    kind: "gym",
    slug: "quartzy",
    org: "Quartzy Capital Advisors, LLC",
    location: "New York, NY",
    roles: [
      {
        title: "Data Research Intern",
        start: "2023-06",
        end: "2023-08",
        bullets: [
          "Wrote a Python tool (yfinance, pandas) that automated historical financial analysis and key metrics, replacing manual Excel work and cutting processing time by 95%+.",
          "Maintained a quantitative investment database of 500+ securities and assessed 200+ institutional investment prospects.",
        ],
      },
    ],
    stack: ["python", "pandas"],
    where: { signpost: "nyc" },
  },
  {
    kind: "gym",
    slug: "homegoods",
    org: "HomeGoods",
    location: "Westwood, MA",
    roles: [
      {
        title: "Merchandise Associate",
        start: "2022-08",
        end: "2025-08",
        bullets: [
          "Helped customers, handled questions, and kept the store in shape.",
          "Unloaded shipments, assembled furniture, made price tags, stocked inventory, and reported maintenance and safety issues.",
        ],
      },
    ],
    stack: [],
    where: near(places.westwood, 1500, -1650),
  },
];
