// The panel's addresses in one place (E14-02), so links, redirects and
// revalidations never spell a route by hand. The redesigned screens (E14-03
// onwards) use these. Some do not exist yet and answer 404 until their task:
// `services` (E14-03, the catalog moves there from /admin) and the sub-pages
// of clients and plans (E14-04, E14-05).

const id = (value: string) => encodeURIComponent(value);

export const adminPaths = {
  home: "/admin",

  leads: "/admin/leads",
  newLead: "/admin/leads/nuevo",
  lead: (leadId: string) => `/admin/leads/${id(leadId)}`,
  acceptProforma: (leadId: string, proformaId: string) =>
    `/admin/leads/${id(leadId)}/aceptar/${id(proformaId)}`,

  clients: "/admin/clientes",
  newClient: "/admin/clientes/nuevo",
  importClients: "/admin/clientes/importar",
  client: (clientId: string) => `/admin/clientes/${id(clientId)}`,
  editClient: (clientId: string) => `/admin/clientes/${id(clientId)}/editar`,
  newClientService: (clientId: string) =>
    `/admin/clientes/${id(clientId)}/servicios/nuevo`,
  clientService: (clientId: string, serviceId: string) =>
    `/admin/clientes/${id(clientId)}/servicios/${id(serviceId)}`,

  due: "/admin/por-vencer",
  owed: "/admin/por-cobrar",

  services: "/admin/servicios",
  service: (serviceId: string) => `/admin/servicios/${id(serviceId)}`,
  newPlan: (serviceId: string) =>
    `/admin/servicios/${id(serviceId)}/planes/nuevo`,
  plan: (serviceId: string, planId: string) =>
    `/admin/servicios/${id(serviceId)}/planes/${id(planId)}`,

  projects: "/admin/proyectos",
  project: (projectId: string) => `/admin/proyectos/${id(projectId)}`,
  posts: "/admin/blog",
  post: (postId: string) => `/admin/blog/${id(postId)}`,
  links: "/admin/enlaces",

  purchases: "/admin/compras",
  newPurchase: "/admin/compras/nueva",
  purchase: (purchaseId: string) => `/admin/compras/${id(purchaseId)}`,
  profits: "/admin/ganancias",

  assistant: "/admin/asistente",
  conversation: (sessionId: string) => `/admin/asistente/${id(sessionId)}`,
  settings: "/admin/configuracion",
} as const;
