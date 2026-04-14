// src/components/DurationsChart.tsx

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Enregistrer les éléments de Chart.js que vous allez utiliser
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface DurationsChartProps {
    data: {
        labels: string[];
        dureePrevue: number[];
        dureeReelle: number[];
    };
}

const DurationsChart: React.FC<DurationsChartProps> = ({ data }) => {
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Durée max',
                data: data.dureePrevue,
                borderColor: '#FF0000',
                backgroundColor: '#FF0000',
                tension: 0.4, // Ajout de la propriété tension pour lisser la courbe
            },
            {
                label: 'Durée Réelle',
                data: data.dureeReelle,
                borderColor: '#39a039ff',
                backgroundColor: '#39a039ff',
                tension: 0.4, // Ajout de la propriété tension pour lisser la courbe
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Durée max vs. Durée Réelle par Étape',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Étape (Intitulé)',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Durée (Nombre)',
                },
                beginAtZero: true,
            },
        },
    };

    return <Line options={options} data={chartData} />;
};

export default DurationsChart;