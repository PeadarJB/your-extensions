import  type {ImmutableObject } from 'jimu-core';

export interface Config {
  // Data configuration
  statisticField?: string;
  statisticType?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  divisor?: number;
  
  // Display configuration
  prefix?: string;
  suffix?: string;
  secondaryPrefix?: string;
  secondarySuffix?: string;
  showSecondaryValue?: boolean;
  
  // Future styling options
  primaryColor?: string;
  secondaryColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export type IMConfig = ImmutableObject<Config>;

export const defaultConfig: Config = {
  statisticField: undefined,
  statisticType: 'SUM',
  divisor: 1,
  prefix: '',
  suffix: '',
  secondaryPrefix: '',
  secondarySuffix: '% of total',
  showSecondaryValue: false,
  primaryColor: '#000000',
  secondaryColor: '#666666',
  fontSize: 'medium'
};