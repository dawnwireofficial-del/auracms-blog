import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import type { Data } from './+data';
import App from '../src/App';
import { resolveRouteFromPath } from '../src/utils/routeResolver';

export default function Page() {
  const data = useData<Data>();
  const pageContext = usePageContext();
  const path = pageContext.urlPathname || pageContext.urlOriginal || '/';
  const initialRoute = resolveRouteFromPath(path);

  return <App initialData={data} initialRoute={initialRoute} />;
}
