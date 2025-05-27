/** @jsx jsx */
import {
  React,
  jsx,
  DataSourceTypes,
  Immutable,
  type ImmutableObject,
  type IMFieldSchema,
  type UseDataSource,
  type DataSource,
  JimuFieldType
} from 'jimu-core';
import type { AllWidgetSettingProps } from 'jimu-for-builder';
import { DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector';
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components';
import { Select, NumericInput, TextInput } from 'jimu-ui';

// Define the structure of our widget's configuration
export interface Config {
  statisticField?: string;
  statisticType?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  divisor?: number;
  prefix?: string;
  suffix?: string;
  secondaryPrefix?: string;
  secondarySuffix?: string;
  showSecondaryValue?: boolean;
}

// Create an immutable version of the Config type
export type IMConfig = ImmutableObject<Config>;

// Define default values for our configuration
const defaultConfig: Config = {
  statisticField: undefined,
  statisticType: 'SUM',
  divisor: 1,
  prefix: '',
  suffix: '',
  secondaryPrefix: '',
  secondarySuffix: '% of total',
  showSecondaryValue: false
};

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const { id, useDataSources, onSettingChange, config } = props;

  // Helper to merge current config with default values
  const currentConfig = { ...defaultConfig, ...config };

  const onDataSourceChange = (newUseDataSources: UseDataSource[]): void => {
    // When the data source changes, reset the selected field and other dependent settings
    onSettingChange({
      id: id,
      useDataSources: newUseDataSources,
      config: {
        ...currentConfig, // Keep other settings
        statisticField: undefined // Reset field as it might not exist in the new DS
      }
    });
    // Fields will be repopulated by the useEffect hook
  };

  const onFieldSelected = (allSelectedFields: IMFieldSchema[], ds: DataSource, isSelectedFromRepeatedDataSourceContext: boolean): void => {
    // The FieldSelector can return multiple fields if `isMultiple` is true,
    // but we only care about the first one for this setting.
    const newField = allSelectedFields && allSelectedFields.length > 0 ? allSelectedFields[0].jimuName : undefined;
    onSettingChange({
      id: id,
      config: { ...currentConfig, statisticField: newField }
    });
  };

  const onStatisticTypeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onSettingChange({
      id: id,
      config: { ...currentConfig, statisticType: event.target.value as Config['statisticType'] }
    });
  };

  const onDivisorChange = (value: number | undefined): void => {
    // Ensure divisor is not zero to prevent division by zero errors later
    const newDivisor = (value === 0 || value === undefined) ? 1 : value;
    onSettingChange({
      id: id,
      config: { ...currentConfig, divisor: newDivisor }
    });
  };

  const onConfigChange = (property: keyof Config, value: any): void => {
    onSettingChange({
      id: id,
      config: { ...currentConfig, [property]: value }
    });
  };

  return (
    <div className="custom-indicator-setting p-3">
      <SettingSection title="Data Source">
        <DataSourceSelector
          types={Immutable([DataSourceTypes.FeatureLayer])}
          useDataSources={useDataSources}
          onChange={onDataSourceChange}
          widgetId={id}
          mustUseDataSource={true}
        />
      </SettingSection>

      {/* Only show these settings if a data source has been selected */}
      {useDataSources && useDataSources.length > 0 && (
        <React.Fragment>
          <SettingSection title="Value Configuration">
            <SettingRow label="Field for Statistic">
              <FieldSelector
                useDataSources={useDataSources}
                onChange={onFieldSelected}
                selectedFields={currentConfig.statisticField ? Immutable([currentConfig.statisticField]) : Immutable([])}
                isMultiple={false}
                types={Immutable([JimuFieldType.Number])}
                placeholder="Select a numeric field"
              />
            </SettingRow>

            <SettingRow label="Statistic Type">
              <Select
                value={currentConfig.statisticType}
                onChange={onStatisticTypeChange}
                size="sm"
              >
                <option value="SUM">Sum</option>
                <option value="AVG">Average</option>
                <option value="COUNT">Count</option>
                <option value="MIN">Minimum</option>
                <option value="MAX">Maximum</option>
              </Select>
            </SettingRow>

            <SettingRow label="Divisor (for unit conversion)">
              <NumericInput
                value={currentConfig.divisor}
                min={0.0000001}
                onChange={onDivisorChange}
                size="sm"
                showHandlers={false}
                defaultValue={1}
              />
            </SettingRow>
          </SettingSection>

          <SettingSection title="Display Settings">
            <SettingRow label="Prefix">
              <TextInput
                value={currentConfig.prefix}
                onChange={(e) => { onConfigChange('prefix', e.target.value); }}
                placeholder="e.g., Total: "
                size="sm"
              />
            </SettingRow>

            <SettingRow label="Suffix">
              <TextInput
                value={currentConfig.suffix}
                onChange={(e) => {onConfigChange('suffix', e.target.value); }}
                placeholder="e.g., km affected"
                size="sm"
              />
            </SettingRow>

            <SettingRow label="Show Secondary Value">
              <input
                type="checkbox"
                checked={currentConfig.showSecondaryValue}
                onChange={(e) => {onConfigChange('showSecondaryValue', e.target.checked); }}
              />
            </SettingRow>

            {currentConfig.showSecondaryValue && (
              <React.Fragment>
                <SettingRow label="Secondary Prefix">
                  <TextInput
                    value={currentConfig.secondaryPrefix}
                    onChange={(e) => {onConfigChange('secondaryPrefix', e.target.value); }}
                    placeholder="e.g., "
                    size="sm"
                  />
                </SettingRow>

                <SettingRow label="Secondary Suffix">
                  <TextInput
                    value={currentConfig.secondarySuffix}
                    onChange={(e) => {onConfigChange('secondarySuffix', e.target.value); }}
                    placeholder="e.g., % of total network"
                    size="sm"
                  />
                </SettingRow>
              </React.Fragment>
            )}
          </SettingSection>
        </React.Fragment>
      )}
    </div>
  );
};

export default Setting;