import { DataTable } from "@/components/admin/data-table";
import { Section } from "@/components/admin/fields";
import { SelectField } from "@/components/form/select-field";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/sitio/button";
import { formatSignedCents, todayInQuito } from "@/lib/clients";
import { formatCents } from "@/lib/price";
import {
  monthlyProfits,
  PROFIT_VIEW_PARAMS,
  profitFilters,
  profitsByClient,
  profitsByService,
  profitYears,
  unusedLicenses,
} from "@/lib/profits";
import { getProfitData } from "@/server/admin-profits";

// Texts from docs/COPY.md §13 (Ganancias).

/**
 * Profits without VAT (E11-06, RF-CRM-21, 22): month by month in the accrual
 * or the cash view, and by service, by client and unused licenses, always by
 * sale date.
 */
export default async function ProfitsPage({
  searchParams,
}: PageProps<"/admin/ganancias">) {
  const currentYear = Number(todayInQuito().slice(0, 4));
  const { year, view } = profitFilters(await searchParams, currentYear);
  const data = await getProfitData();
  const monthly = monthlyProfits(data, year, view);
  const services = profitsByService(data, year);
  const clients = profitsByClient(data, year);
  const licenses = unusedLicenses(data, year);
  const accrual = view === "accrual";
  const nothing = `Sin ventas ni compras en ${year}.`;
  const hasMoves = monthly.months.some(
    (month) =>
      month.incomeCents ||
      month.directCostCents ||
      month.sharedCents ||
      month.lossCents,
  );

  return (
    <div className="flex max-w-[72rem] flex-col gap-10">
      <PageHeader
        title="Ganancias"
        intro="Lo que ganas, sin IVA: lo que vendes menos lo que te cuesta."
        actions={
          <a
            href={`/admin/ganancias/exportar?anio=${year}&vista=${PROFIT_VIEW_PARAMS[view]}`}
            download
            className="inline-flex min-h-12 items-center"
          >
            Exportar a CSV
          </a>
        }
      />

      {/* A plain GET form: the year and the view live in the address. */}
      <form className="grid items-end gap-4 sm:grid-cols-[10rem_14rem_auto]">
        <SelectField
          label="Año"
          id="ganancias-anio"
          name="anio"
          defaultValue={String(year)}
        >
          {profitYears(data, currentYear, year).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Vista"
          id="ganancias-vista"
          name="vista"
          defaultValue={PROFIT_VIEW_PARAMS[view]}
        >
          <option value={PROFIT_VIEW_PARAMS.accrual}>Devengado</option>
          <option value={PROFIT_VIEW_PARAMS.cash}>Caja</option>
        </SelectField>
        <Button type="submit" variant="secondary">
          Ver
        </Button>
      </form>
      <p className="max-w-[68ch]">
        {accrual
          ? "Devengado: cada venta cuenta en el mes en que la hiciste, y las compras compartidas se reparten entre los meses que cubren."
          : "Caja: cuenta cuando te pagan y cuando pagas a tus proveedores."}
      </p>

      <Section title="Mes a mes">
        <DataTable
          rows={
            hasMoves
              ? [
                  ...monthly.months,
                  { ...monthly.total, month: 13, label: `Total ${year}` },
                ]
              : []
          }
          rowKey={(row) => String(row.month)}
          label={`Mes a mes, ${year}`}
          empty={nothing}
          columns={[
            { header: "Mes", cell: (row) => row.label, rowHeader: true },
            {
              header: "Ingresos",
              cell: (row) => formatCents(row.incomeCents),
              numeric: true,
            },
            {
              header: "Costos directos",
              cell: (row) => formatCents(row.directCostCents),
              numeric: true,
            },
            {
              header: "Compras compartidas",
              cell: (row) => formatCents(row.sharedCents),
              numeric: true,
            },
            ...(accrual
              ? [
                  {
                    header: "Pérdidas",
                    cell: (row: (typeof monthly.months)[number]) =>
                      formatCents(row.lossCents),
                    numeric: true,
                  },
                ]
              : []),
            {
              header: "Ganancia",
              cell: (row) => formatSignedCents(row.profitCents),
              numeric: true,
              emphasis: true,
            },
          ]}
        />
      </Section>

      <Section title="Por servicio">
        <p>Siempre por fecha de venta, en las dos vistas.</p>
        <DataTable
          rows={services}
          rowKey={(row) => row.key}
          label={`Ganancias por servicio, ${year}`}
          empty={nothing}
          columns={[
            { header: "Servicio", cell: (row) => row.name, rowHeader: true },
            {
              header: "Ingresos",
              cell: (row) => formatCents(row.incomeCents),
              numeric: true,
            },
            {
              header: "Costos directos",
              cell: (row) => formatCents(row.directCostCents),
              numeric: true,
            },
            {
              header: "Compras compartidas",
              cell: (row) => formatCents(row.sharedCents),
              numeric: true,
            },
            {
              header: "Ganancia",
              cell: (row) => formatSignedCents(row.profitCents),
              numeric: true,
              emphasis: true,
            },
          ]}
        />
      </Section>

      <Section title="Por cliente">
        <p>
          Siempre por fecha de venta, con su costo directo; las compras
          compartidas no se reparten por cliente.
        </p>
        <DataTable
          rows={clients}
          rowKey={(row) => row.clientId}
          label={`Ganancias por cliente, ${year}`}
          empty={`Ninguna venta en ${year}.`}
          columns={[
            { header: "Cliente", cell: (row) => row.name, rowHeader: true },
            {
              header: "Ingresos",
              cell: (row) => formatCents(row.incomeCents),
              numeric: true,
            },
            {
              header: "Costo directo",
              cell: (row) => formatCents(row.directCostCents),
              numeric: true,
            },
            {
              header: "Ganancia",
              cell: (row) => formatSignedCents(row.profitCents),
              numeric: true,
              emphasis: true,
            },
          ]}
        />
      </Section>

      <Section title="Licencias sin asignar">
        <p>Lo que pagas por licencias que ningún cliente usa.</p>
        <DataTable
          rows={licenses}
          rowKey={(row) => row.purchaseId}
          label={`Licencias sin asignar, ${year}`}
          empty="Todas tus licencias están asignadas."
          columns={[
            { header: "Compra", cell: (row) => row.concept, rowHeader: true },
            { header: "Proveedor", cell: (row) => row.provider },
            {
              header: "Licencias",
              cell: (row) => `${row.assigned} de ${row.quantity} asignadas`,
            },
            { header: "Sin uso", cell: (row) => row.unused, numeric: true },
            {
              header: `Costo sin uso en ${year}`,
              cell: (row) => formatCents(row.costCents),
              numeric: true,
              emphasis: true,
            },
          ]}
        />
      </Section>

      <p className="text-small">
        Los montos no incluyen IVA. Las compras al exterior incluyen el IVA y el
        ISD pagados aquí, porque son parte del costo.
      </p>
    </div>
  );
}
