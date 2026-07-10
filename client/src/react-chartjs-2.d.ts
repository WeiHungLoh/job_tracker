declare module 'react-chartjs-2' {
    import type { ChartOptions } from 'chart.js';
    import type { ComponentType } from 'react';

    export type TypedChartProps<TType extends 'bar' | 'line'> = {
        data: object;
        options?: ChartOptions<TType>;
    };

    export const Bar: ComponentType<TypedChartProps<'bar'>>;
    export const Line: ComponentType<TypedChartProps<'line'>>;
}
