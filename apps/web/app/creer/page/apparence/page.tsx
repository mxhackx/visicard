import type { Metadata } from "next";
import ApparenceStep from "@/components/page-builder/apparence-step";

export const metadata: Metadata = { title: "Votre page digitale : apparence" };

export default function CreerPageApparence() {
  return <ApparenceStep mode="client" />;
}
