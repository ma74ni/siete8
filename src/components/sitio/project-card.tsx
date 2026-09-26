import Image from "next/image";
import Link from "next/link";

import { PROJECT_STATUS_LABELS } from "@/lib/project-status";
import type { ProjectCardData } from "@/server/portfolio";

/**
 * Portfolio card (DESIGN §7): 16:10 capture on `mist` without shadow, title,
 * summary and the status as plain text (SRS 3.7).
 */
export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <article className="flex flex-col gap-3">
      {project.coverUrl && (
        <div className="relative aspect-[16/10] bg-mist">
          <Image
            src={project.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 368px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <h3 className="text-h4">
        <Link href={`/proyectos/${project.slug}`} className="text-fg">
          {project.title}
        </Link>
      </h3>
      {project.summary && <p>{project.summary}</p>}
      <p className="text-small font-medium">
        {PROJECT_STATUS_LABELS[project.status]}
      </p>
    </article>
  );
}
