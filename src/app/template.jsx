/**
 * Wraps every page and is re-mounted on each navigation, so each new page fades in.
 * (Changes that stay on the same page, such as filters in the URL, do not re-mount it.)
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export default function Template({ children }) {
  return <div className="animate-in fade-in-0 duration-300 ease-out">{children}</div>;
}
