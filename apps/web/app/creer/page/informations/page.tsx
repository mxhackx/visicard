import type { Metadata } from "next";
import InformationsStep from "@/components/page-builder/informations-step";

export const metadata: Metadata = { title: "Votre page digitale : informations — Moncode" };

export default function CreerPageInformations() {
  return <InformationsStep mode="client" />;
}
