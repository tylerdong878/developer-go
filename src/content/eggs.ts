import { near, places } from "./places";
import type { Egg } from "./types";

export const eggs: Egg[] = [
  {
    kind: "egg",
    slug: "aerobloom",
    km: 10,
    title: "AeroBloom",
    body: "My ECE capstone: a drone that inspects small gardens, a solar ESP32 that reads the soil and runs a pump, and a dashboard that ties them together. I wrote the system design and the first drone scripts. The drone just arrived and I'm debugging takeoff.",
    stack: ["python", "opencv", "esp32"],
    where: near(places.northeastern, -330, 60),
  },
  {
    kind: "egg",
    slug: "fall-2026",
    km: 5,
    title: "This semester",
    body: "Building a 16-bit signed adder in SystemVerilog for a PYNQ-Z2 FPGA, and learning Lean in Logic & Computation.",
    stack: ["systemverilog", "fpga", "lean"],
    where: near(places.northeastern, 60, -520),
  },
];
