/**
 * White card that frames a guest form: title, subtitle, the form, and a footer line.
 *
 * @param {object} props
 * @param {string} props.title - Card heading, e.g. "Sign in".
 * @param {string} props.subtitle - One line under the heading.
 * @param {React.ReactNode} props.footer - Line under the form, e.g. a link to the other auth page.
 * @param {React.ReactNode} props.children - The form.
 * @returns {JSX.Element}
 */
export function AuthCard({ title, subtitle, footer, children }) {
  return (
    <section className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-[0_8px_24px_-6px] shadow-foreground/10">
      <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.01em]">{title}</h2>
      <p className="mt-1 text-[15px] leading-[22px] text-muted-foreground">{subtitle}</p>

      <div className="mt-6">{children}</div>

      <p className="mt-6 text-center text-[13px] leading-5 text-muted-foreground">{footer}</p>
    </section>
  );
}

/** Classes shared by the primary submit button of every auth form. */
export const AUTH_SUBMIT_CLASS = "mt-2.5 h-[42px] w-full rounded-[10px] text-[15px] font-bold hover:bg-primary/90";

/** Classes for inline text links inside auth cards ("Sign in", "Forgot password?"). */
export const AUTH_LINK_CLASS = "font-bold text-brand-strong hover:underline";
