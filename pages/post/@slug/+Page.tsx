import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import type { Data } from './+data';
import App from '../../../src/App';

export default function Page() {
  const data = useData<Data>();
  const pageContext = usePageContext();
  const slug = pageContext.routeParams?.slug;
  const { post, comments, clusters, upgrades, prevArticle, nextArticle, ...sharedData } = data;
  return (
    <App
      initialData={sharedData}
      routeSpecific={{ post, comments, clusters, upgrades, prevArticle, nextArticle }}
      initialRoute={{ name: 'post', param: slug }}
    />
  );
}
