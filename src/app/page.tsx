import { ShiftStart } from "@/components/ShiftStart";
import { QuickLinks } from "@/components/QuickLinks";
import { HandoverNotes } from "@/components/HandoverNotes";

// This file is a Server Component. It puts the page together;
// the interactive parts are Client Components ("use client").
export default function Home() {
  return (
    <ShiftStart
      sidebar={
        <>
          <QuickLinks />
          <HandoverNotes />
        </>
      }
    />
  );
}
