/**
 * Re-mounted on each admin page change, so the new page fades in while the frame stays.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export default function AdminTemplate({ children }) {
  return <div className="animate-in fade-in-0 duration-300 ease-out">{children}</div>;
}
