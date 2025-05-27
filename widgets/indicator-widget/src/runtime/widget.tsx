/** @jsx jsx */
import { React, jsx, type AllWidgetProps } from 'jimu-core';

// For this initial simple version, we won't define a specific config interface yet.
// We'll use `any` for props.config for now.
// As we add settings, we'll create a `config.ts` and import a proper Config interface.

const Widget = (props: AllWidgetProps<any>) => {
  const { useDataSources, id } = props;

  let dataSouceSelectedMessage = "No data source selected.";
  if (useDataSources && useDataSources.length > 0 && useDataSources[0].dataSourceId) {
    dataSouceSelectedMessage = `Data source selected: ${useDataSources[0].dataSourceId}`;
  }

  return (
    <div className="custom-indicator-widget jimu-widget p-3 text-center">
      <h4>Indicator Placeholder</h4>
      <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0' }}>
        ---
      </p>
      <p className="text-muted small">
        {dataSouceSelectedMessage}
      </p>
      <p className="text-muted small">Widget ID: {id}</p>
    </div>
  );
};

export default Widget;
