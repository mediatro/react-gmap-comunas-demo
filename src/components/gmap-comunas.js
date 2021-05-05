import React, {useContext, useState, useEffect} from 'react';
import {Map, GoogleApiWrapper, Polygon, Polyline, Marker} from 'google-maps-react';
import {GeoJsonLoaderContext} from "../services/geojson-loader";
import {useQuery} from "react-query";

const getApiKey = () => {
    return 'AIzaSyDzSs-TUYGCsb1gkIWLt2T_etS2Mu8mlME';
}

export const GmapComunas = (props) => {

    const jlc = useContext(GeoJsonLoaderContext);

    const [jsonLoaded, setJsonLoaded] = useState(false);
    const [layer, setLayer] = useState('comunas');
    const [center, setCenter] = useState();
    const [bounds, setBounds] = useState();
    const [zoom, setZoom] = useState(14);

    useEffect(() => {
        jlc.loader.init$().subscribe(r => {
            setJsonLoaded(true);
        });

    }, []);


    const jumpToFeature = (key, id) => {
        id = parseInt(id);
        let feature = jlc.loader.getFeatureById(key, id);
        if(feature){
            let poly = jlc.loader.getPolyFromFeature([id, feature]);
            let bounds = jlc.loader.getPolygonBounds(poly);
            setBounds(new props.google.maps.LatLngBounds(
                bounds[0], bounds[1]
            ));
            if(layer !== key){
                setLayer(key);
            }
        }
    }

    const defaultPolygonOptions = {
        strokeColor: '#888888',
        fillColor: '#888888',
    }

    const hoverPolygonOptions = {
        strokeColor: '#006400',
        fillColor: '#ff0000',
    }

    const handlePolygonClick = (key, id, item) => {
        if(props.onPolygonClick){
            props.onPolygonClick(key, id, item);
        }
    }

    const handlePolygonMouseover = (e, v) => {
        v.setOptions(hoverPolygonOptions);
    }

    const handlePolygonMouseout = (e, v) => {
        v.setOptions(defaultPolygonOptions);
    }

    const handleZoomChange = (z, m) => {
        setZoom(z);
    }

    const toggleLayer = () => {
        setLayer(layer === 'comunas' ? 'subzonas' : 'comunas');
    }

    const getPolygonsData = (key) => {
        let ret = [];
        for(let arr of jlc.loader.getFeatures(key)){
            ret.push({...arr[1].properties,
                paths: jlc.loader.getPolyFromFeature(arr)
            });
        }

        if(!center && ret.length > 0) {
            setCenter(ret[0].paths[0]);
        }
        return ret;
    }

    const defaultPolygonProps = {...defaultPolygonOptions,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillOpacity: 0.35,
        onMouseover: handlePolygonMouseover,
        onMouseout: handlePolygonMouseout,
    }

    const getPolygonsJsx = key => jsonLoaded && layer === key ? getPolygonsData(key).map(item =>
            <Polygon {...defaultPolygonProps}
                     paths={item.paths}
                     onClick={(e, v)=> handlePolygonClick(key, item.id, item)}
            />

    )  : null;

    const getMarkersJsx = key => jsonLoaded && layer === key && props.maxMarkerZoom && props.maxMarkerZoom <= zoom ? getPolygonsData(key).map(item =>
            <Marker label={item.rentabilidad.toString()}
                    position={jlc.loader.getPolygonCenter(item.paths)}
                    onClick={(e, v)=> handlePolygonClick(key, item.id, item)}
                    icon={{
                        path: props.google.maps.SymbolPath.CIRCLE,
                        scale: 0
                    }}
            />
    )  : null;

    return (
        <div>
            <button onClick={toggleLayer}>Toggle Layer (current: {layer})</button>
            <label>
                Input id:
                <input type="text" onChange={(e)=>jumpToFeature(layer, e.target.value)} />
            </label>
            <Map google={props.google}
                 zoom={14}
                 bounds={bounds}
                 center={center}
                 onZoomChanged={(mapProps,m) => handleZoomChange(m.zoom, m)}
            >
                {getPolygonsJsx('comunas')}
                {getPolygonsJsx('subzonas')}
                {getMarkersJsx('comunas')}
                {getMarkersJsx('subzonas')}
            </Map>
        </div>
    )
}

export const GmapComunasWrapped = GoogleApiWrapper({
    apiKey: getApiKey()
})(GmapComunas);
