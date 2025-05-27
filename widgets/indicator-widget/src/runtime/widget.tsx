/** @jsx jsx */
import {
  React,
  jsx,
  type AllWidgetProps,
  DataSourceManager,
  type QueriableDataSource,
  type DataRecord,
  type ImmutableObject
} from 'jimu-core';

const { useState, useEffect } = React;

// Import the Config interface we defined in setting.tsx
interface Config {
  statisticField?: string;
  statisticType?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  divisor?: number;
  prefix?: string;
  suffix?: string;
  secondaryPrefix?: string;
  secondarySuffix?: string;
  showSecondaryValue?: boolean;
}

type IMConfig = ImmutableObject<Config>;

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { useDataSources, id, config } = props;

  // State to hold the calculated values
  const [primaryValue, setPrimaryValue] = useState<number | null>(null);
  const [secondaryValue, setSecondaryValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Default config values
  const currentConfig: Config = {
    statisticField: undefined,
    statisticType: 'SUM',
    divisor: 1,
    prefix: '',
    suffix: '',
    secondaryPrefix: '',
    secondarySuffix: '% of total',
    showSecondaryValue: false,
    ...config
  };

  // Function to calculate statistics from data records
  const calculateStatistic = (records: DataRecord[], field: string, type: string): number | null => {
    if (!records || records.length === 0) return null;

    const values: number[] = [];
    records.forEach(record => {
      const value = record.getData()[field];
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    });

    if (values.length === 0) return null;

    switch (type) {
      case 'SUM':
        return values.reduce((sum, val) => sum + val, 0);
      case 'AVG':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'COUNT':
        return values.length;
      case 'MIN':
        return Math.min(...values);
      case 'MAX':
        return Math.max(...values);
      default:
        return values.reduce((sum, val) => sum + val, 0); // Default to SUM
    }
  };

  // Function to format numbers for display
  const formatNumber = (value: number): string => {
    // Apply divisor
    const adjustedValue = value / (currentConfig.divisor || 1);
    
    // Format with appropriate decimal places
    if (adjustedValue >= 1000) {
      return adjustedValue.toLocaleString(undefined, { maximumFractionDigits: 1 });
    } else if (adjustedValue >= 10) {
      return adjustedValue.toFixed(1);
    } else {
      return adjustedValue.toFixed(2);
    }
  };

  // Function to query data and calculate values
  const queryAndCalculate = async () => {
    if (!useDataSources || useDataSources.length === 0 || !currentConfig.statisticField) {
      setPrimaryValue(null);
      setSecondaryValue(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dsManager = DataSourceManager.getInstance();
      const ds = dsManager.getDataSource(useDataSources[0].dataSourceId) as QueriableDataSource;

      if (!ds) {
        throw new Error('Data source not found');
      }

      // Query all records (this will automatically respect any active filters)
      const queryResult = await ds.query({
        where: '1=1', // Get all records
        outFields: [currentConfig.statisticField],
        returnGeometry: false
      });

      const records = queryResult?.records || [];
      setTotalRecords(records.length);

      // Calculate the primary statistic
      const calculatedValue = calculateStatistic(
        records,
        currentConfig.statisticField,
        currentConfig.statisticType || 'SUM'
      );

      setPrimaryValue(calculatedValue);

      // Calculate secondary value (percentage) if needed
      if (currentConfig.showSecondaryValue && calculatedValue !== null) {
        // For secondary value, we might want to show percentage of total
        // This could be enhanced to compare against a baseline or total dataset
        // For now, we'll show the percentage of records that have non-zero values
        const nonZeroRecords = records.filter(record => {
          const value = record.getData()[currentConfig.statisticField];
          return typeof value === 'number' && value > 0;
        });
        const percentage = records.length > 0 ? (nonZeroRecords.length / records.length) * 100 : 0;
        setSecondaryValue(percentage);
      } else {
        setSecondaryValue(null);
      }

    } catch (err) {
      console.error('Error querying data:', err);
      setError(err.message || 'Failed to load data');
      setPrimaryValue(null);
      setSecondaryValue(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to run query when dependencies change
  useEffect(() => {
    queryAndCalculate();
  }, [useDataSources, currentConfig.statisticField, currentConfig.statisticType, currentConfig.divisor]);

  // Listen for data source changes (including filter changes)
  useEffect(() => {
    if (!useDataSources || useDataSources.length === 0) return;

    const dsManager = DataSourceManager.getInstance();
    const ds = dsManager.getDataSource(useDataSources[0].dataSourceId);

    if (ds) {
      // Listen for data source updates (including filter changes)
      const handleDataSourceChange = () => {
        queryAndCalculate();
      };

      // Subscribe to data source events
      ds.ready().then(() => {
        ds.on('records-change', handleDataSourceChange);
      });

      // Cleanup function
      return () => {
        ds.off('records-change', handleDataSourceChange);
      };
    }
  }, [useDataSources]);

  // Render the widget
  if (!useDataSources || useDataSources.length === 0) {
    return (
      <div className="custom-indicator-widget jimu-widget p-3 text-center">
        <p className="text-muted">No data source selected.</p>
        <p className="text-muted small">Configure this widget to select a data source.</p>
      </div>
    );
  }

  if (!currentConfig.statisticField) {
    return (
      <div className="custom-indicator-widget jimu-widget p-3 text-center">
        <p className="text-muted">No field selected.</p>
        <p className="text-muted small">Configure this widget to select a field for calculation.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-indicator-widget jimu-widget p-3 text-center">
        <p className="text-danger">Error loading data</p>
        <p className="text-muted small">{error}</p>
      </div>
    );
  }

  return (
    <div className="custom-indicator-widget jimu-widget p-3 text-center">
      {isLoading ? (
        <div>
          <p style={{ fontSize: '2em', fontWeight: 'bold', margin: '10px 0' }}>
            Loading...
          </p>
        </div>
      ) : (
        <React.Fragment>
          {/* Primary value display */}
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '10px 0', lineHeight: '1.2' }}>
            {currentConfig.prefix}{primaryValue !== null ? formatNumber(primaryValue) : '---'}{currentConfig.suffix}
          </div>

          {/* Secondary value display */}
          {currentConfig.showSecondaryValue && secondaryValue !== null && (
            <div style={{ fontSize: '1em', color: '#666', margin: '5px 0' }}>
              {currentConfig.secondaryPrefix}{secondaryValue.toFixed(1)}{currentConfig.secondarySuffix}
            </div>
          )}

          {/* Debug info (can be removed in production) */}
          <div className="text-muted small" style={{ marginTop: '10px' }}>
            Records: {totalRecords} | Field: {currentConfig.statisticField} | Type: {currentConfig.statisticType}
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Widget;