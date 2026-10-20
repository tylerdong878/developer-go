"use client";

/** Opens the print dialog, where "Save as PDF" makes a PDF of the resume. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="font-semibold text-mystic-500 underline underline-offset-2">
      Print or save as PDF
    </button>
  );
}
