declare module 'react-chartjs-2' {
    import type { ChartOptions } from 'chart.js'
    import type { ComponentType } from 'react'

    export type TypedChartProps<TType extends 'line' | 'pie'> = {
        data: object
        options?: ChartOptions<TType>
    }

    export const Line: ComponentType<TypedChartProps<'line'>>
    export const Pie: ComponentType<TypedChartProps<'pie'>>
}
