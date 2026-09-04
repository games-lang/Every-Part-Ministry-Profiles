import './_group.css';
import { Current } from './Current';

/**
 * Cleaner is a presentation variant of the extracted church setup.
 *
 * The extracted form remains the source of truth for every field, label,
 * validation rule, mutation, and interaction. This layer deliberately only
 * changes the reading rhythm: a quieter canvas, stronger section boundaries,
 * wider breathing room, and a persistent save action on long pages.
 */
export function Cleaner() {
  return (
    <div className="cleaner-church-setup">
      <style>{`
        .cleaner-church-setup {
          --cleaner-ink: hsl(204 38% 19%);
          --cleaner-paper: hsl(42 35% 96%);
          --cleaner-card: hsl(42 43% 99%);
          --cleaner-line: hsl(38 19% 82% / .72);
          --cleaner-teal: hsl(174 34% 38%);
          min-height: 100dvh;
          background:
            radial-gradient(circle at 88% 0%, hsl(40 72% 61% / .13), transparent 26rem),
            linear-gradient(180deg, hsl(42 43% 99% / .72), hsl(42 35% 96%));
          color: var(--cleaner-ink);
        }

        .cleaner-church-setup .church-setup-preview {
          width: min(100%, 72rem);
          max-width: 72rem;
          padding: 2.5rem clamp(1rem, 4vw, 3.5rem) 6rem;
          gap: 1.35rem;
        }

        .cleaner-church-setup .church-setup-preview > :first-child {
          position: relative;
          margin: 0 0 .45rem;
          padding: .2rem 0 1.1rem;
          border-bottom: 1px solid var(--cleaner-line);
        }

        .cleaner-church-setup .church-setup-preview > :first-child::before {
          content: "EVERY PART  /  CHURCH PROFILE";
          display: block;
          margin-bottom: .7rem;
          color: var(--cleaner-teal);
          font-family: var(--app-font-sans);
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .16em;
        }

        .cleaner-church-setup .church-setup-preview > :first-child h1 {
          color: var(--cleaner-ink);
          font-size: clamp(1.8rem, 3vw, 2.35rem);
          line-height: 1.08;
        }

        .cleaner-church-setup .church-setup-preview > :first-child p {
          max-width: 38rem;
          margin-top: .55rem;
          font-size: .95rem;
        }

        .cleaner-church-setup .church-setup-preview > .border-primary\\/20 {
          border-color: hsl(174 34% 38% / .25);
          background: linear-gradient(112deg, hsl(174 34% 38% / .09), hsl(40 72% 61% / .1));
          box-shadow: 0 10px 30px hsl(204 38% 19% / .055);
        }

        .cleaner-church-setup .church-setup-preview > .border-primary\\/20 .font-mono {
          color: var(--cleaner-ink);
          font-size: .78rem;
        }

        .cleaner-church-setup .church-setup-preview > .border-border\\/60,
        .cleaner-church-setup .church-setup-preview form > .border-primary\\/20,
        .cleaner-church-setup .church-setup-preview form > .border-border\\/60 {
          overflow: clip;
          border-color: var(--cleaner-line);
          background: hsl(42 43% 99% / .9);
          box-shadow: 0 5px 18px hsl(204 38% 19% / .035);
        }

        .cleaner-church-setup .church-setup-preview .p-6 {
          padding: clamp(1rem, 2.4vw, 1.65rem);
        }

        .cleaner-church-setup .church-setup-preview .space-y-8 {
          row-gap: 1.35rem;
        }

        .cleaner-church-setup .church-setup-preview .space-y-7 {
          row-gap: 1.5rem;
        }

        .cleaner-church-setup .church-setup-preview .space-y-6 {
          row-gap: 1.15rem;
        }

        .cleaner-church-setup .church-setup-preview [class*="rounded-xl"][class*="border"] {
          border-color: hsl(38 19% 82% / .68);
        }

        .cleaner-church-setup .church-setup-preview form > div:last-child > div:last-child {
          position: sticky;
          bottom: .8rem;
          z-index: 12;
          margin-top: .45rem;
          border: 1px solid hsl(174 34% 38% / .18);
          border-radius: .8rem;
          background: hsl(42 43% 99% / .95);
          box-shadow: 0 12px 26px hsl(204 38% 19% / .12);
          backdrop-filter: blur(12px);
        }

        .cleaner-church-setup .church-setup-preview form > div:last-child > div:last-child button[type="submit"] {
          min-width: 9rem;
          background: var(--cleaner-teal);
          color: hsl(42 35% 96%);
          box-shadow: 0 3px 0 hsl(174 34% 27% / .2);
        }

        .cleaner-church-setup .church-setup-preview input,
        .cleaner-church-setup .church-setup-preview [role="combobox"] {
          min-height: 2.65rem;
          background: hsl(42 43% 99% / .86);
        }

        .cleaner-church-setup .church-setup-preview label {
          letter-spacing: -.005em;
        }

        .cleaner-church-setup .church-setup-preview .rounded-lg.border {
          background: hsl(42 43% 99% / .65);
        }

        .cleaner-church-setup .church-setup-preview .grid.gap-2.sm\\:grid-cols-2 > label {
          transition: background-color .18s ease, border-color .18s ease;
        }

        .cleaner-church-setup .church-setup-preview .grid.gap-2.sm\\:grid-cols-2 > label:hover {
          border-color: hsl(174 34% 38% / .4);
          background: hsl(174 34% 38% / .06);
        }

        @media (max-width: 640px) {
          .cleaner-church-setup .church-setup-preview {
            padding: 1.45rem .85rem 5.75rem;
            gap: 1rem;
          }

          .cleaner-church-setup .church-setup-preview > :first-child {
            padding-bottom: .9rem;
          }

          .cleaner-church-setup .church-setup-preview > :first-child::before {
            font-size: .6rem;
            letter-spacing: .12em;
          }

          .cleaner-church-setup .church-setup-preview .p-6,
          .cleaner-church-setup .church-setup-preview .px-6 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .cleaner-church-setup .church-setup-preview form > div:last-child > div:last-child {
            bottom: .45rem;
            margin-left: -.2rem;
            margin-right: -.2rem;
          }

          .cleaner-church-setup .church-setup-preview form > div:last-child > div:last-child button[type="submit"] {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cleaner-church-setup .church-setup-preview .grid.gap-2.sm\\:grid-cols-2 > label {
            transition: none;
          }
        }
      `}</style>
      <Current />
    </div>
  );
}

export default Cleaner;