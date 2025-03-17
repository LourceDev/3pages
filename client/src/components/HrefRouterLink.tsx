import { Link } from "react-router";

type TypeofLink = typeof Link;

interface HrefRouterLinkProps extends TypeofLink {
  href: string;
}

export default function HrefRouterLink(props: HrefRouterLinkProps) {
  return <Link to={props.href} {...props} />;
}
