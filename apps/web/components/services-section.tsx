import Link from "next/link";
import { ArrowRight, FileText, Images, PanelsTopLeft } from "lucide-react";
import { SERVICES, type ServiceType } from "@/lib/services";
import SectionHeading from "@/components/section-heading";

const icons: Record<ServiceType, typeof PanelsTopLeft> = {
  page: PanelsTopLeft,
  media: Images,
  document: FileText,
};

export default function ServicesSection() {
  return (
    <section id="services" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title={
            <>
              Trois services,
              <br className="hidden sm:block" /> un seul QR code
            </>
          }
          subtitle="Lequel vous correspond ?"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service, index) => {
            const Icon = icons[service.id];

            return (
              <article
                key={service.id}
                className="surface surface-hover group flex flex-col items-center px-6 py-8 text-center hover:-translate-y-1"
                data-reveal
                style={{ "--d": `${index * 80}ms` } as React.CSSProperties}
              >
                <span className="icon-tile h-14 w-14">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>

                <h3 className="mt-5 text-xl font-semibold leading-snug text-ink/90">{service.name}</h3>
                <p className="mt-3 max-w-[17rem] text-[15px] leading-7 text-sage">{service.description}</p>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-ink/90">{service.price}</span>
                  <span className="text-xs font-medium text-sage">FCFA</span>
                </p>

                <Link
                  href={service.href}
                  className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-forest transition-colors hover:text-forest-dark"
                >
                  {service.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
