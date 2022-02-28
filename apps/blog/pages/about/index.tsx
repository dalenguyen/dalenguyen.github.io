import { GetStaticProps } from 'next';
import './index.module.scss';

/* eslint-disable-next-line */
export interface AboutProps {
  name: string
}

export const getStaticProps: GetStaticProps<AboutProps> = async (context) => {
  return {
    props: {
      name: 'Dale'
    },
  };
};

export function About(props: AboutProps) {
  return (
    <div>
      <h1>Welcome, { props.name }!</h1>
    </div>
  );
}

export default About
