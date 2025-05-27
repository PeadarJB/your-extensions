/** @jsx jsx */
import { React, jsx, DataSourceTypes, Immutable } from 'jimu-core';
import  type { AllWidgetSettingProps } from 'jimu-for-builder';
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector';
import { SettingSection } from 'jimu-ui/advanced/setting-components';

// For this initial simple version, we won't define a specific config interface yet.
// We'll use `any` for props.config for now.

const Setting = (props: AllWidgetSettingProps<any>) => {
  const { id, useDataSources, onSettingChange } = props;

  const onDataSourceChange = (newUseDataSources: any[]): void => {
    // When a data source is selected or changed,
    // we update the widget's configuration with the new useDataSources array.
    onSettingChange({
      id: id,
      useDataSources: newUseDataSources
    });
  };

  return (
    <div className="custom-indicator-setting p-3">
      <SettingSection title="Data Source">
        <DataSourceSelector
          types={Immutable([DataSourceTypes.FeatureLayer])} // We expect a feature layer for statistical queries
          useDataSources={useDataSources}
          onChange={onDataSourceChange}
          widgetId={id}
          mustUseDataSource={true} // Require at least one data source
        />
      </SettingSection>
      <hr />
      <p className="text-disabled small">
        More settings for field selection, statistics, and appearance will be added here later.
      </p>
    </div>
  );
};

export default Setting;