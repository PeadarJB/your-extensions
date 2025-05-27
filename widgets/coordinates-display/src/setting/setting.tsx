/** @jsx jsx */
import { React, jsx } from 'jimu-core';
import type { AllWidgetSettingProps } from 'jimu-for-builder';
import { MapWidgetSelector, SettingSection,} from 'jimu-ui/advanced/setting-components';

const Setting = (props: AllWidgetSettingProps<any>) => {
  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds
    });
  };

  return (
    <div className="coordinates-display-setting p-2">
      <SettingSection title="Map Settings">
        <MapWidgetSelector
            useMapWidgetIds={props.useMapWidgetIds}
            onSelect={onMapWidgetSelected}
        />
      </SettingSection>
    </div>
  );
};

export default Setting;