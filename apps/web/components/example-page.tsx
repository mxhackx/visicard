"use client";

import RestaurantCardLayout from "@/components/RestaurantCardLayout";
import { EXAMPLES, sampleImage } from "@/lib/examples";
import type { LayoutId } from "@/lib/palette";

/** Page d'exemple complète d'un style, avec du contenu fictif. */
export default function ExamplePage({ layout }: { layout: LayoutId }) {
  const ex = EXAMPLES[layout];
  if (!ex) return null;
  const alt: [string, string] = [ex.tones[1], ex.tones[0]];
  return (
    <RestaurantCardLayout
      layout={layout}
      restaurantName={ex.restaurantName}
      tagline={ex.tagline}
      address={ex.address}
      phoneNumber={ex.phoneNumber}
      additionalInfo={ex.additionalInfo}
      schedule={ex.schedule}
      menuImages={ex.menuLabels.map((l, i) => sampleImage(l, ex.tones, 600, 800, `m${i}`))}
      placeImages={[0, 1, 2, 3].map((i) => sampleImage("", i % 2 ? alt : ex.tones, 800, 600, `p${i}`))}
      inPreview
    />
  );
}
