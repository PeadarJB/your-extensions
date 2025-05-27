import { React, type AllWidgetProps, jsx } from 'jimu-core';
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis';
import type Point from 'esri/geometry/Point';

const { useState } = React;

const Widget = (props: AllWidgetProps<any>) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      // When the pointer moves, take the pointer location and create a Point
      // Geometry out of it (`view.toMap(...)`), then update the state.
      jmv.view.on('pointer-move', (evt) => {
        const point: Point = jmv.view.toMap({
          x: evt.x,
          y: evt.y
        });
        // Check if point is not null and has latitude/longitude
        if (point && point.latitude != null && point.longitude != null) {
          setLatitude(point.latitude.toFixed(3));
          setLongitude(point.longitude.toFixed(3));
        } else {
          // Clear if point is invalid or off the map
          setLatitude('');
          setLongitude('');
        }
      });

      // Optional: Clear coordinates when pointer leaves the view
      jmv.view.on('pointer-leave', () => {
        setLatitude('');
        setLongitude('');
      });
    }
  };

  return (
    <div className="widget-coordinates-display jimu-widget">
      {/* Check if a map widget is selected in the settings */}
      {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
        <JimuMapViewComponent
          useMapWidgetId={props.useMapWidgetIds?.[0]}
          onActiveViewChange={activeViewChangeHandler}
        />
      )}
      {/* Display message if no map is selected */}
      {(!props.useMapWidgetIds || props.useMapWidgetIds.length === 0) && (
        <p>Please select a Map widget in the settings.</p>
      )}
      <p>
        Lat: {latitude}
        <br />
        Lon: {longitude}
      </p>
    </div>
  );
};

export default Widget;