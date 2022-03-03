import Link from 'next/link';
import './custom-link.module.scss';

export interface CustomLinkProps {
  as: string;
  href: string;
}

export function CustomLink({ as, href, ...otherProps }: CustomLinkProps) {
  return (
    <Link as={as} href={href}>
      <a {...otherProps} />
    </Link>
  );
}

export default CustomLink;