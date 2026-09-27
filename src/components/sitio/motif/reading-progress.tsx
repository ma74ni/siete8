import styles from "@/components/sitio/motif/motif.module.css";

/**
 * Reading progress for articles (DESIGN §6): a 3 px bar with the brand
 * gradient on the top edge, driven by the page scroll in CSS. Decorative.
 */
export function ReadingProgress() {
  return <div aria-hidden className={styles.progress} />;
}
