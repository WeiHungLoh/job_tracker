declare module 'react-chartjs-2' {
    import type { ChartOptions, Plugin } from 'chart.js';
    import type { ComponentType } from 'react';

    export type TypedChartProps<TType extends 'bar' | 'line'> = {
        data: object;
        options?: ChartOptions<TType>;
        plugins?: Plugin<TType>[];
    };

    export const Bar: ComponentType<TypedChartProps<'bar'>>;
    export const Line: ComponentType<TypedChartProps<'line'>>;
}
