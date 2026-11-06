"use client";

import type { ReactNode } from "react";

const SCREEN = 375;

/**
 * Cadre de téléphone : la page est rendue à une largeur réaliste (375 px) puis réduite,
 * pour que les aperçus montrent la vraie mise en page d'un mobile et non une version écrasée.
 */
export default function PhonePreview({
  children,
  width = 260,
  height = 460,
  className = "",
  ...rest
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const scale = width / SCREEN;
  return (
    <div
      className={`mx-auto rounded-[2.2rem] bg-ink p-2 shadow-[0_24px_50px_rgba(23,23,26,0.22)] ${className}`}
      style={{ width: width + 16 }}
      {...rest}
    >
      <div className="relative overflow-hidden rounded-[1.7rem] bg-white" style={{ width, height }}>
        <div
          className="absolute left-0 top-0 origin-top-left overflow-y-auto overflow-x-hidden"
          style={{ width: SCREEN, height: height / scale, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
