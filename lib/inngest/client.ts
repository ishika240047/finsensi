import { Inngest } from "inngest";

// Inngest client used to schedule and run background automation jobs
export const inngest = new Inngest({
  id: "finsensi",
  name: "FinSensi Financial Assistant",
});
