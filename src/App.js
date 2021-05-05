import logo from './logo.svg';
import './App.css';
import {GmapComunasWrapped} from "./components/gmap-comunas";
import {GeoJsonLoaderProvider} from "./services/geojson-loader";
import {QueryClient, QueryClientProvider} from "react-query";


const host =  '/';

const urlConfig = {
    'comunas': {url: `${host}comunas.geojson`},
    'subzonas': {url: `${host}subzonas.geojson`}
}

function App() {
  const queryClient = new QueryClient();

  return (
      <QueryClientProvider client={queryClient}>
      <GeoJsonLoaderProvider queryClient={queryClient} urlConfig={urlConfig}>
        <div className="App">
          <GmapComunasWrapped maxMarkerZoom={12}
                              onPolygonClick={(key, id, item)=>console.log('clicked', key, id, item)}

          />
        </div>
      </GeoJsonLoaderProvider>
      </QueryClientProvider>
  );
}

export default App;
