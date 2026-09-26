export type SkillKind = "language" | "framework" | "infra" | "api" | "hardware";

type Skill = { name: string; kind: SkillKind; learning?: boolean };

/**
 * Every skill that can appear in a stack. Stacks reference these ids, so a
 * typo is a type error, and the bag counts come from real usage.
 */
export const skills = {
  python: { name: "Python", kind: "language" },
  cpp: { name: "C++", kind: "language" },
  c: { name: "C", kind: "language" },
  go: { name: "Go", kind: "language" },
  java: { name: "Java", kind: "language" },
  typescript: { name: "TypeScript", kind: "language" },
  javascript: { name: "JavaScript", kind: "language" },
  csharp: { name: "C#", kind: "language" },
  dart: { name: "Dart", kind: "language" },
  sql: { name: "SQL", kind: "language" },
  powershell: { name: "PowerShell", kind: "language" },
  bash: { name: "Bash", kind: "language" },
  racket: { name: "Racket", kind: "language" },
  matlab: { name: "MATLAB", kind: "language" },
  "html-css": { name: "HTML/CSS", kind: "language" },
  systemverilog: { name: "SystemVerilog", kind: "language", learning: true },
  lean: { name: "Lean", kind: "language", learning: true },

  pytorch: { name: "PyTorch", kind: "framework" },
  numpy: { name: "NumPy", kind: "framework" },
  pandas: { name: "pandas", kind: "framework" },
  statsmodels: { name: "statsmodels", kind: "framework" },
  matplotlib: { name: "Matplotlib", kind: "framework" },
  opencv: { name: "OpenCV", kind: "framework" },
  llamaindex: { name: "LlamaIndex", kind: "framework" },
  langchain: { name: "LangChain", kind: "framework" },
  "stable-baselines3": { name: "Stable-Baselines3", kind: "framework" },
  gymnasium: { name: "Gymnasium", kind: "framework" },
  fastapi: { name: "FastAPI", kind: "framework" },
  flask: { name: "Flask", kind: "framework" },
  react: { name: "React", kind: "framework" },
  nextjs: { name: "Next.js", kind: "framework" },
  "react-native": { name: "React Native", kind: "framework" },
  flutter: { name: "Flutter", kind: "framework" },
  tailwind: { name: "Tailwind", kind: "framework" },
  r3f: { name: "react-three-fiber", kind: "framework" },
  p5js: { name: "p5.js", kind: "framework" },
  mediapipe: { name: "MediaPipe", kind: "framework" },
  unity: { name: "Unity", kind: "framework" },
  "ml-agents": { name: "ML-Agents", kind: "framework" },
  playwright: { name: "Playwright", kind: "framework" },
  pytest: { name: "pytest", kind: "framework" },
  junit: { name: "JUnit", kind: "framework" },
  processing: { name: "Processing", kind: "framework" },

  aws: { name: "AWS", kind: "infra" },
  tpm: { name: "NitroTPM", kind: "infra" },
  convex: { name: "Convex", kind: "infra" },
  firebase: { name: "Firebase", kind: "infra" },
  docker: { name: "Docker", kind: "infra" },
  "github-actions": { name: "GitHub Actions", kind: "infra" },
  "azure-devops": { name: "Azure DevOps", kind: "infra" },
  arrow: { name: "Apache Arrow/Parquet", kind: "infra" },
  gradle: { name: "Gradle", kind: "infra" },
  git: { name: "Git", kind: "infra" },
  linux: { name: "Linux", kind: "infra" },
  webrtc: { name: "WebRTC", kind: "infra" },

  gemini: { name: "Gemini API", kind: "api" },
  "google-maps": { name: "Google Maps", kind: "api" },
  "spotify-api": { name: "Spotify API", kind: "api" },

  arduino: { name: "Arduino", kind: "hardware" },
  esp32: { name: "ESP32", kind: "hardware" },
  fpga: { name: "FPGA (PYNQ-Z2)", kind: "hardware" },
  solidworks: { name: "SolidWorks", kind: "hardware" },
  onshape: { name: "OnShape", kind: "hardware" },
  autocad: { name: "AutoCAD", kind: "hardware" },
  soldering: { name: "Soldering", kind: "hardware" },
  "3d-printing": { name: "3D printing", kind: "hardware" },
} as const satisfies Record<string, Skill>;

export type SkillId = keyof typeof skills;
