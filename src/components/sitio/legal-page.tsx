import { Closing } from "@/components/sitio/closing";
import { Floor } from "@/components/sitio/floor";

type LegalPageProps = {
  title: string;
  /** e.g. "Última actualización: 29 de septiembre de 2026." */
  updated: string;
  sections: { heading: string; body: string }[];
};

/** Privacy policy and terms (COPY §7.1, §7.2): one readable column. */
export function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <>
      <Floor>
        <article className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1>{title}</h1>
            <p className="text-small">{updated}</p>
          </div>
          {sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-h3">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </article>
      </Floor>
      <Closing />
    </>
  );
}
