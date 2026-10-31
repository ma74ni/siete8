import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/action-form";
import { RenewalInputs } from "@/components/admin/client-service-fields";
import { CheckboxField } from "@/components/form/checkbox-field";
import { DeleteButton } from "@/components/admin/delete-button";
import { Section } from "@/components/admin/fields";
import { SelectField } from "@/components/form/select-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PageHeader } from "@/components/admin/page-header";
import { PriceField } from "@/components/admin/price-field";
import { FormField } from "@/components/form/form-field";
import { isUuid } from "@/lib/admin-forms";
import { formatDecimal, planRenewal } from "@/lib/clients";
import {
  HOLDER_LABELS,
  holderTypes,
  type HolderType,
  requirementsByHolder,
} from "@/lib/service-page";
import {
  getServiceForAdmin,
  type ServiceForAdmin,
} from "@/server/admin-catalog";
import {
  deleteFaq,
  deletePlan,
  deleteStep,
  saveFaq,
  saveHolderNote,
  savePlan,
  saveRequirements,
  saveStep,
  updateService,
} from "@/server/admin-catalog-actions";

// Texts from docs/COPY.md §13.

const HOLDER_OPTIONS: { value: HolderType; label: string }[] = [
  { value: "not_applicable", label: "No aplica" },
  { value: "natural", label: HOLDER_LABELS.natural },
  { value: "legal_entity", label: HOLDER_LABELS.legal_entity },
];

/** Edit one service: its plans and its page texts (E4-02, E4-03). */
export default async function EditServicePage({
  params,
}: PageProps<"/admin/servicios/[id]">) {
  const { id } = await params;
  // A malformed id is just a missing service; any other error is shown as such.
  if (!isUuid(id)) notFound();
  const service = await getServiceForAdmin(id);
  if (!service) notFound();

  return (
    <div className="flex max-w-[64rem] flex-col gap-10">
      <PageHeader
        title={service.name}
        back={{ href: "/admin", label: "Volver a servicios" }}
        intro={
          <>
            {service.category?.name}.{" "}
            {service.visible ? (
              <Link href={`/servicios/${service.slug}`}>Ver en el sitio</Link>
            ) : (
              "Oculto: no aparece en el sitio."
            )}
          </>
        }
      />

      <Section title="Planes y precios">
        <p className="max-w-[68ch]">
          Escribe el precio sin IVA: el sitio muestra el total con IVA,
          redondeado a dos decimales.
        </p>
        {service.plan.map((plan) => (
          <PlanEditor key={plan.id} serviceId={service.id} plan={plan} />
        ))}
        <PlanEditor serviceId={service.id} />
      </Section>

      <Section title="Requisitos y avisos">
        <HolderContent service={service} />
      </Section>

      <Section title="Pasos: así lo obtienes">
        {service.service_step.map((step) => (
          <StepEditor key={step.id} serviceId={service.id} step={step} />
        ))}
        <StepEditor serviceId={service.id} />
      </Section>

      <Section title="Preguntas frecuentes">
        {service.service_faq.map((faq) => (
          <FaqEditor key={faq.id} serviceId={service.id} faq={faq} />
        ))}
        <FaqEditor serviceId={service.id} />
      </Section>

      <Section title="Datos y textos de la página">
        <ServiceEditor service={service} />
      </Section>
    </div>
  );
}

function PlanEditor({
  serviceId,
  plan,
}: {
  serviceId: string;
  plan?: ServiceForAdmin["plan"][number];
}) {
  // Every plan form on the page needs its own field ids.
  const key = plan?.id ?? "nuevo";
  return (
    <div className="flex flex-col gap-4 rounded-control border border-border p-5">
      <h3 className="text-h4">
        {plan
          ? plan.holder_type === "not_applicable"
            ? plan.name
            : `${plan.name}, ${HOLDER_LABELS[plan.holder_type]}`
          : "Agregar un plan"}
      </h3>
      <ActionForm
        resetKey={plan?.updated_at}
        action={savePlan}
        submitLabel={plan ? "Guardar plan" : "Agregar plan"}
        variant={plan ? "primary" : "secondary"}
      >
        {plan && <input type="hidden" name="id" value={plan.id} />}
        <input type="hidden" name="service_id" value={serviceId} />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Nombre"
            name="name"
            id={`name-${key}`}
            hint="Por ejemplo: 1 año"
            defaultValue={plan?.name}
            required
            maxLength={60}
          />
          <SelectField
            label="Tipo de titular"
            id={`holder-${key}`}
            name="holder_type"
            defaultValue={plan?.holder_type ?? "not_applicable"}
          >
            {HOLDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <FormField
            label="Orden"
            name="sort_order"
            id={`sort-${key}`}
            type="number"
            min={0}
            defaultValue={plan?.sort_order ?? 0}
            hint="Menor número, primero"
          />
        </div>
        <FormField
          label="Qué incluye"
          name="detail"
          id={`detail-${key}`}
          maxLength={200}
          defaultValue={plan?.detail ?? ""}
          hint="Una línea bajo el nombre del plan. Ej: 1 sitio web y 3 cuentas de correo de 5 GB"
        />
        <PriceField
          idPrefix={`plan-${key}`}
          price={plan?.price_without_vat ?? 0}
          vatRate={plan?.vat_rate ?? 0.15}
        />
        <RenewalInputs
          idPrefix={`plan-${key}`}
          // A new plan starts at 1 year, the most common period.
          renewal={plan ? planRenewal(plan) : { value: "1", unit: "year" }}
        />
        <FormField
          label="Costo sin IVA"
          name="cost_without_vat"
          id={`cost-${key}`}
          inputMode="decimal"
          className="max-w-[32rem]"
          defaultValue={
            plan?.plan_cost
              ? formatDecimal(plan.plan_cost.cost_without_vat)
              : ""
          }
          hint="Lo que te cuesta a ti, por ejemplo la firma al distribuidor. Solo lo ves en el panel y se precarga al registrar una venta. Vacío: sin costo directo."
        />
        <div className="flex flex-wrap gap-x-6">
          <CheckboxField
            id={`visible-${key}`}
            name="visible"
            label="Visible en el sitio"
            defaultChecked={plan?.visible ?? true}
          />
          <CheckboxField
            id={`recommended-${key}`}
            name="recommended"
            label="Recomendado"
            defaultChecked={plan?.recommended ?? false}
          />
        </div>
      </ActionForm>
      {plan && (
        <DeleteButton
          action={deletePlan}
          id={plan.id}
          label="Borrar plan"
          question={`¿Borrar el plan ${plan.name}? También se borran sus requisitos y no se puede deshacer.`}
        />
      )}
    </div>
  );
}

function ServiceEditor({ service }: { service: ServiceForAdmin }) {
  return (
    <ActionForm
      resetKey={service.updated_at}
      action={updateService}
      submitLabel="Guardar servicio"
    >
      <input type="hidden" name="id" value={service.id} />
      <CheckboxField
        id="service-visible"
        name="visible"
        label="Visible en el sitio (si lo ocultas, su página responde 404)"
        defaultChecked={service.visible}
      />
      <FormField
        label="Resumen"
        name="summary"
        multiline
        maxLength={400}
        defaultValue={service.summary ?? ""}
        hint="Párrafo del hero y texto del catálogo."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Plazo aproximado"
          name="timeline"
          maxLength={60}
          defaultValue={service.timeline ?? ""}
          hint="Dato del hero. Ej: De 7 a 10 días. Vacío: no se muestra."
        />
        <FormField
          label="Precio (si no tiene planes)"
          name="price_note"
          maxLength={60}
          defaultValue={service.price_note ?? ""}
          hint="Ej: Cotización por WhatsApp. Con planes, el hero muestra Desde $…"
        />
      </div>
      <MarkdownEditor
        name="body_md"
        label="Contenido de la página"
        defaultValue={service.body_md ?? ""}
        hint="Va después del hero: para quién es, qué incluye y plazo. Markdown: ## Subtítulo, **negrita**, listas con guion. Vacío: no se muestra."
      />
      <FormField
        label="Introducción de requisitos"
        name="requirements_intro"
        multiline
        maxLength={400}
        defaultValue={service.requirements_intro ?? ""}
      />
      <FormField
        label="Título del cierre"
        name="closing_title"
        maxLength={120}
        defaultValue={service.closing_title ?? ""}
        hint="Vacío: ¿Qué necesitas resolver?"
      />
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-h4">Venta cruzada</legend>
        <SelectField
          label="Servicio sugerido"
          id="field-related_service_id"
          name="related_service_id"
          defaultValue={service.related_service_id ?? ""}
        >
          <option value="">Ninguno</option>
          {service.otherServices.map((other) => (
            <option key={other.id} value={other.id}>
              {other.name}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Texto"
          name="cross_sell_text"
          multiline
          maxLength={300}
          defaultValue={service.cross_sell_text ?? ""}
          hint="Solo se muestra si el servicio sugerido está visible."
        />
        <FormField
          label="Texto del botón"
          name="cross_sell_cta"
          maxLength={60}
          defaultValue={service.cross_sell_cta ?? ""}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-h4">SEO</legend>
        <FormField
          label="Título"
          name="seo_title"
          maxLength={70}
          defaultValue={service.seo_title ?? ""}
          hint="Hasta 70 caracteres. Vacío: el nombre del servicio."
        />
        <FormField
          label="Descripción"
          name="seo_description"
          multiline
          maxLength={160}
          defaultValue={service.seo_description ?? ""}
          hint="Hasta 160 caracteres. Vacío: el resumen."
        />
      </fieldset>
    </ActionForm>
  );
}

function HolderContent({ service }: { service: ServiceForAdmin }) {
  const plans = service.plan.map((plan) => ({
    holderType: plan.holder_type,
    sortOrder: plan.sort_order,
    requirements: plan.requirement.map((item) => ({
      text: item.text,
      required: item.required,
      sortOrder: item.sort_order,
    })),
  }));
  const holders = holderTypes(plans);
  if (holders.length === 0) {
    return <p>Agrega un plan para poder cargar sus requisitos.</p>;
  }
  const groups = requirementsByHolder(plans);

  return holders.map((holder) => {
    const items =
      groups.find((group) => group.holderType === holder)?.items ?? [];
    const note = service.service_holder_note.find(
      (item) => item.holder_type === holder,
    );
    const label =
      holder === "not_applicable" ? "Todos los planes" : HOLDER_LABELS[holder];
    return (
      <div
        key={holder}
        className="flex flex-col gap-6 rounded-control border border-border p-5"
      >
        <h3 className="text-h4">{label}</h3>
        <ActionForm
          resetKey={items.map((item) => item.text).join("|")}
          action={saveRequirements}
          submitLabel="Guardar requisitos"
        >
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="holder_type" value={holder} />
          <FormField
            label="Requisitos"
            name="items"
            id={`requirements-${holder}`}
            multiline
            rows={Math.max(4, items.length + 1)}
            defaultValue={items.map((item) => item.text).join("\n")}
            hint="Uno por línea, en el orden en que se muestran. Se aplican a todos los planes de este tipo."
          />
        </ActionForm>
        <ActionForm
          resetKey={note?.body ?? ""}
          action={saveHolderNote}
          submitLabel="Guardar aviso"
        >
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="holder_type" value={holder} />
          <FormField
            label="Aviso bajo los planes"
            name="body"
            id={`note-${holder}`}
            maxLength={300}
            defaultValue={note?.body ?? ""}
            hint="Por ejemplo: Los planes de 7 y 30 días no están disponibles. Vacío: sin aviso."
          />
        </ActionForm>
      </div>
    );
  });
}

function StepEditor({
  serviceId,
  step,
}: {
  serviceId: string;
  step?: ServiceForAdmin["service_step"][number];
}) {
  const key = step?.id ?? "nuevo";
  return (
    <div className="flex flex-col gap-4 rounded-control border border-border p-5">
      {!step && <h3 className="text-h4">Agregar un paso</h3>}
      <ActionForm
        resetKey={step?.updated_at}
        action={saveStep}
        submitLabel={step ? "Guardar paso" : "Agregar paso"}
        variant={step ? "primary" : "secondary"}
      >
        {step && <input type="hidden" name="id" value={step.id} />}
        <input type="hidden" name="service_id" value={serviceId} />
        <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
          <FormField
            label="Paso"
            name="body"
            id={`step-${key}`}
            multiline
            rows={2}
            required
            maxLength={300}
            defaultValue={step?.body}
          />
          <FormField
            label="Orden"
            name="sort_order"
            id={`step-order-${key}`}
            type="number"
            min={0}
            defaultValue={step?.sort_order ?? 0}
          />
        </div>
      </ActionForm>
      {step && (
        <DeleteButton
          action={deleteStep}
          id={step.id}
          label="Borrar paso"
          question="¿Borrar este paso? No se puede deshacer."
        />
      )}
    </div>
  );
}

function FaqEditor({
  serviceId,
  faq,
}: {
  serviceId: string;
  faq?: ServiceForAdmin["service_faq"][number];
}) {
  const key = faq?.id ?? "nueva";
  return (
    <div className="flex flex-col gap-4 rounded-control border border-border p-5">
      {!faq && <h3 className="text-h4">Agregar una pregunta</h3>}
      <ActionForm
        resetKey={faq?.updated_at}
        action={saveFaq}
        submitLabel={faq ? "Guardar pregunta" : "Agregar pregunta"}
        variant={faq ? "primary" : "secondary"}
      >
        {faq && <input type="hidden" name="id" value={faq.id} />}
        <input type="hidden" name="service_id" value={serviceId} />
        <div className="grid gap-4 md:grid-cols-[1fr_8rem]">
          <FormField
            label="Pregunta"
            name="question"
            id={`question-${key}`}
            required
            maxLength={200}
            defaultValue={faq?.question}
          />
          <FormField
            label="Orden"
            name="sort_order"
            id={`faq-order-${key}`}
            type="number"
            min={0}
            defaultValue={faq?.sort_order ?? 0}
          />
        </div>
        <FormField
          label="Respuesta"
          name="answer"
          id={`answer-${key}`}
          multiline
          required
          maxLength={1000}
          defaultValue={faq?.answer}
        />
      </ActionForm>
      {faq && (
        <DeleteButton
          action={deleteFaq}
          id={faq.id}
          label="Borrar pregunta"
          question={`¿Borrar la pregunta "${faq.question}"? No se puede deshacer.`}
        />
      )}
    </div>
  );
}
