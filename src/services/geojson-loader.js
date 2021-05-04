import React from 'react';
import {combineLatest, Subject} from "rxjs";
import {map, mergeMap, switchMap} from "rxjs/operators";
import {QueryObserver} from "react-query";
import {fromFetch} from "rxjs/fetch";

const { createContext } = React;

export const GeoJsonLoaderContext = createContext(null);

export const GeoJsonLoaderProvider = (props) => {

    const loader = new GeoJsonLoader();
    loader.qc = props.queryClient;
    loader.urlConfig = props.urlConfig;

    const value = {
        loader: loader,
    };

    return (
        <GeoJsonLoaderContext.Provider value={value}>
            {props.children}
        </GeoJsonLoaderContext.Provider>
    );
};

export class GeoJsonLoader {

    urlConfig = {};
    rqOptions = {};

    qc = null;

    cache = new Map();

    load$(url){
        return fromFetch(url).pipe(
            switchMap(response => response.json()),
        );
    }

    setRawJson(key, json){
        let map = new Map();
        json.features.forEach(feature => {
            map.set(feature.properties.id, feature);
        })
        this.cache.set(key, map);
    }

    loadAll$(){
        let all = [];
        for(let k in this.urlConfig){
            let qo = new QueryObserver(this.qc, {...this.rqOptions,
                queryKey: k,
                queryFn: () => this.load$(this.urlConfig[k].url).toPromise()
            });
            let s = new Subject();
            qo.subscribe(result => s.next({key: k, json: result.data}));
            all.push(s);
        }
        return combineLatest(all);
    }

    init$(){
        this.cache = new Map();

        return this.loadAll$().pipe(map(arr => {
            for(let a of arr){
                this.setRawJson(a.key, a.json);
            }
            return arr;
        }));
    }

    getFeatures(key){
        return this.cache.get(key) ? this.cache.get(key): new Map();
    }

    getFeatureById(key, id){
        return this.getFeatures(key).get(id);
    }

    getPolyFromFeature(arr){
        let coords = arr[1].geometry.coordinates[0];
        if(arr[1].geometry.type === 'MultiPolygon'){
            coords = coords[0];
        }
        return coords.map(iarr => ({lat: iarr[1], lng: iarr[0]}));
    }

    getPolygonCenter(poly){
        let bounds = this.getPolygonBounds(poly);
        return {
            lat: (bounds[0].lat + bounds[1].lat) / 2,
            lng: (bounds[0].lng + bounds[1].lng) / 2,
        };
    }

    getPolygonBounds(poly){
        return [
            {
                lat: Math.min(...poly.map(ll => ll.lat)),
                lng: Math.min(...poly.map(ll => ll.lng)),
            },
            {
                lat: Math.max(...poly.map(ll => ll.lat)),
                lng: Math.max(...poly.map(ll => ll.lng)),
            },
        ];
    }


}
