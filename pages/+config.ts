import vikeReact from 'vike-react/config';

export default {
  extends: vikeReact,
  clientRouting: true,
  hydrationCanBeAborted: true,
  meta: {
    title: { env: { server: true, client: true } },
    description: { env: { server: true, client: true } },
  },
};
