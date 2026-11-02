// The look of a side bar entry (DESIGN §12): the links of `PanelNav` and the
// account entries of the panel layout. Apart from panel-nav.tsx, which is a
// client module: a server component importing it there gets a reference, not
// the class names.
export const navItem =
  "flex min-h-11 items-center rounded-control border-l-4 border-transparent px-3 font-medium text-fg no-underline hover:bg-surface lg:min-h-0 lg:py-1 aria-[current=page]:border-accent aria-[current=page]:bg-surface";
