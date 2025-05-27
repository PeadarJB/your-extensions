/** @jsx jsx */
import {
  React,
  jsx,
  type AllWidgetProps,
  DataSourceManager,
  type QueriableDataSource,
  type FeatureLayerDataSource, // To cast the data source
  css // For basic styling
} from 'jimu-core';

const { useState, useEffect, useCallback } = React;

// Define the structure of our widget's configuration
// This should ideally be in a shared src/config.ts file
export interface Config {
  statisticField?: string;
  statisticType?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  divisor?: number;
  prefix?: string;
  suffix?: string;
  showSecondaryValue?: boolean;
  secondaryPrefix?: string;
  secondarySuffix?: string;
  secondaryValueDenominator?: number; // For percentage calculation
  decimalPlaces?: number; // For formatting the main value
  secondaryDecimalPlaces?: number; // For formatting the secondary value
}

// Define default values for our configuration
const defaultConfig: Config = {
  statisticField: undefined,
  statisticType: 'SUM',
  divisor: 1,
  prefix: '',
  suffix: '',
  showSecondaryValue: false,
  secondaryPrefix: '',
  secondarySuffix: '%',
  secondaryValueDenominator: undefined,
  decimalPlaces: 1,
  secondaryDecimalPlaces: 2
};

const Widget = (props: AllWidgetProps<Config>) => {
  const { config, useDataSources, id } = props;

  // Merge provided config with defaults to ensure all properties are available
  const currentConfig = React.useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  const [mainValue, setMainValue] = useState<string | number>('---');
  const [secondaryDisplayValue, setSecondaryDisplayValue] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<FeatureLayerDataSource | null>(null);

  const fetchData = useCallback(async () => {
    if (!useDataSources || useDataSources.length === 0 || !currentConfig.statisticField) {
      setMainValue('---');
      setSecondaryDisplayValue('');
      return;
    }

    setIsLoading(true);

    const dsId = useDataSources[0].dataSourceId;
    let currentDs = dataSource;

    // Get or update the data source instance if it has changed
    if (!currentDs || currentDs.id !== dsId) {
      const newDsInstance = DataSourceManager.getInstance().getDataSource(dsId) as FeatureLayerDataSource;
      if (!newDsInstance) {
        console.error(`Indicator Widget (${id}): Data source with ID ${dsId} not found.`);
        setMainValue('Error: DS');
        setSecondaryDisplayValue('');
        setIsLoading(false);
        return;
      }
      setDataSource(newDsInstance);
      currentDs = newDsInstance;
    }

    // Ensure it's a QueriableDataSource (FeatureLayerDataSource is)
    const queriableDs = currentDs as QueriableDataSource;

    const statisticDefinition: any = {
      onStatisticField: currentConfig.statisticField,
      outStatisticFieldName: 'indicator_value',
      statisticType: currentConfig.statisticType?.toLowerCase() || 'sum'
    };

    const queryParams: any = {
      outStatistics: [statisticDefinition],
      returnGeometry: false
      // The current filters applied by other widgets are automatically included by the DataSource object
    };

    try {
      const result = await queriableDs.query(queryParams);

      if (result && result.records && result.records.length > 0) {
        const attributes = result.records[0].getData();
        let calculatedValue = attributes.indicator_value;

        if (calculatedValue !== null && calculatedValue !== undefined) {
          if (currentConfig.divisor && currentConfig.divisor !== 0) {
            calculatedValue /= currentConfig.divisor;
          }
          setMainValue(calculatedValue.toFixed(currentConfig.decimalPlaces));

          // Calculate and set secondary value if enabled and denominator is provided
          if (currentConfig.showSecondaryValue) {
            if (currentConfig.secondaryValueDenominator && currentConfig.secondaryValueDenominator !== 0) {
              const percentage = (calculatedValue / currentConfig.secondaryValueDenominator) * 100;
              setSecondaryDisplayValue(percentage.toFixed(currentConfig.secondaryDecimalPlaces));
            } else {
              // If no denominator, maybe just show the main value again or a placeholder
              // For now, let's clear it or show a specific message if denominator is missing
              setSecondaryDisplayValue(''); // Or "N/A" or some other indicator
            }
          } else {
            setSecondaryDisplayValue('');
          }
        } else {
          // Handle case where statistic result is null (e.g., count on no features)
          setMainValue(0..toFixed(currentConfig.decimalPlaces));
          setSecondaryDisplayValue('');
        }
      } else {
        // No records returned from statistic query (could be valid, e.g., count is 0)
        setMainValue(0..toFixed(currentConfig.decimalPlaces));
        setSecondaryDisplayValue('');
      }
    } catch (error) {
      console.error(`Indicator Widget (${id}): Error fetching statistics:`, error);
      setMainValue('Error');
      setSecondaryDisplayValue('');
    } finally {
      setIsLoading(false);
    }
  }, [useDataSources, currentConfig, dataSource, id]); // Add id to dependencies for logging

  // Effect to fetch data when config or selected data sources change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized, this runs when its dependencies change

  // Effect to listen for data source changes (e.g., filters applied by other widgets)
  useEffect(() => {
    if (dataSource) {
      const handleDataSourceInfoChange = () => {
        // console.log(`Indicator Widget (${id}): Data source info changed, refetching.`);
        fetchData();
      };

      // Cast dataSource to any to satisfy TypeScript for .on() and .off() methods
      const eventedDataSource = dataSource as any;

      eventedDataSource.on('DATA_SOURCE_INFO_CHANGE', handleDataSourceInfoChange);
      eventedDataSource.on('SOURCE_RECORDS_CHANGE', handleDataSourceInfoChange);

      return () => {
        eventedDataSource.off('DATA_SOURCE_INFO_CHANGE', handleDataSourceInfoChange);
        eventedDataSource.off('SOURCE_RECORDS_CHANGE', handleDataSourceInfoChange);
      };
    }
  }, [dataSource, fetchData, id]); // Add id to dependencies for logging

  // Basic styling (can be expanded or moved to CSS files)
  const widgetStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1rem;
    text-align: center;
    box-sizing: border-box;
  `;

  const mainValueStyle = css`
    font-size: 2em; /* Example size, make configurable later */
    font-weight: bold;
    line-height: 1.1;
    color: ${currentConfig.prefix || currentConfig.suffix ? 'inherit' : '#333'}; /* Example color */
  `;

  const secondaryValueStyle = css`
    font-size: 0.9em; /* Example size */
    color: #6c757d; /* Example color */
    margin-top: 0.25rem;
  `;

  if (isLoading) {
    return <div css={widgetStyle} className="jimu-widget">Loading...</div>;
  }

  if (!useDataSources || useDataSources.length === 0) {
    return <div css={widgetStyle} className="jimu-widget">Please configure a data source in settings.</div>;
  }

  if (!currentConfig.statisticField) {
    return <div css={widgetStyle} className="jimu-widget">Please select a field in settings.</div>;
  }

  return (
    <div css={widgetStyle} className="custom-indicator-widget jimu-widget">
      <div>
        <span css={mainValueStyle}>
          {currentConfig.prefix}{mainValue}{currentConfig.suffix}
        </span>
      </div>
      {currentConfig.showSecondaryValue && secondaryDisplayValue !== '' && (
        <div css={secondaryValueStyle}>
          {currentConfig.secondaryPrefix}{secondaryDisplayValue}{currentConfig.secondarySuffix}
        </div>
      )}
      {currentConfig.showSecondaryValue &&
       secondaryDisplayValue === '' &&
       currentConfig.secondaryValueDenominator === undefined && (
        <div css={secondaryValueStyle} className="text-disabled small">
          (Configure denominator for secondary value)
        </div>
      )}
    </div>
  );
};

export default Widget;
