/** Titre de section centré : grand titre sombre, sous-titre gris court. */
export default function SectionHeading({
  title,
  subtitle,
  className = "",
  align = "center",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : "text-left"} ${className}`}
      data-reveal
    >
      <h2 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink/90 sm:text-[2.5rem]">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-sage sm:text-lg">{subtitle}</p>}
    </div>
  );
}
