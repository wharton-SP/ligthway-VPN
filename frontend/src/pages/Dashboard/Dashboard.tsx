import { useEffect, useMemo, useState, type JSX } from "react"
import type { ServerData, Summary } from "../../types/Types"
import { data, useOutletContext } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { FileQuestion } from "lucide-react";

type OutletCtx = {
    data: ServerData | null;
}

const COLORS = ["#60a5fa", "#f87171"]; // blue-500, red-400

// Fonctions de conversion
const gbToMo = (gb: number): number => (gb ?? 0) * 1024;
const bytesToMo = (bytes: number): number => (bytes ?? 0) / (1024 * 1024);
const mbpsToMops = (mbps: number): number => (mbps ?? 0) / 8;

function Dashboard(): JSX.Element {
    const [summary, setSummary] = useState<Summary | null>(null)
    const { data } = useOutletContext<OutletCtx>()

    useEffect(() => {
        setSummary(data?.summary ?? null);
        console.log("summary:", summary);
    }, [data])

    if (!summary) return <></>

    // Données converties en Mo
    const bandwidthData = [
        { name: "Recv (Mo/s)", value: mbpsToMops(summary.current_bandwidth_recv_mbps) },
        { name: "Sent (Mo/s)", value: mbpsToMops(summary.current_bandwidth_sent_mbps) },
        { name: "Total (Mo/s)", value: mbpsToMops(summary.current_bandwidth_total_mbps) },
    ];

    const peersData = [
        { name: "Active Peers", value: summary.active_peers },
        { name: "Inactive Peers", value: summary.inactive_peers },
    ];

    // Calcul des valeurs en Mo
    const totalReceivedMo = gbToMo(summary.total_received_gb);
    const totalReceivedMoFromBytes = bytesToMo(summary.total_received_bytes);
    const totalSentMo = gbToMo(summary.total_sent_gb);
    const totalSentMoFromBytes = bytesToMo(summary.total_sent_bytes);
    const totalTrafficMo = gbToMo(summary.total_traffic_gb);

    return (
        <>
            <div className=''>
                <div className='text-xl text-gray-500 my-6 mt-12 mr-8 flex flex-col items-center'>
                    DashBoard
                </div>
                <div className='h-64 w-full'>
                    <div className="p-6 flex flex-col gap-8">

                        {/* ----- PEERS + BANDWIDTH SECTION ----- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* PIE CHART: ACTIVE VS INACTIVE */}
                            <div className="bg-white p-4 rounded-xl shadow">
                                <h2 className="text-xl font-semibold mb-4">Peers Status</h2>
                                <div className="w-full h-80 flex flex-col items-center justify-center">
                                    {
                                        summary.total_peers ?
                                            (
                                                <PieChart width={350} height={300}>
                                                    <Pie
                                                        data={peersData}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={110}
                                                        dataKey="value"
                                                        label
                                                        isAnimationActive={false}
                                                    >
                                                        {peersData.map((_, index) => (
                                                            <Cell key={index} fill={COLORS[index]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            ) :
                                            <>
                                                <div className="flex flex-col text-gray-400">
                                                    <div className="flex flex-row justify-center">
                                                        <div className="bg-gray-100 p-4 rounded-4xl">
                                                            <FileQuestion size={25} />
                                                        </div>
                                                    </div>
                                                    <div className="text-center font-semibold">
                                                        No peers available
                                                    </div>
                                                    <div className="font-light text-gray-500">
                                                        The data will appear when peers are available
                                                    </div>
                                                </div>
                                            </>
                                    }
                                </div>
                                <div className="text-center mt-4">
                                    <p>Total Peers: <strong>{summary.total_peers}</strong></p>
                                </div>
                            </div>

                            {/* BANDWIDTH BAR CHART (en Mo/s) */}
                            <div className="bg-white p-4 rounded-xl shadow">
                                <h2 className="text-xl font-semibold mb-4">Current Bandwidth</h2>
                                <div className="flex flex-col items-center">
                                    <BarChart width={350} height={300} data={bandwidthData}>
                                        <XAxis dataKey="name" />
                                        <YAxis label={{ value: 'Mo/s', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip
                                            formatter={(value) => [`${Number(value).toFixed(2)} Mo/s`, 'Débit']}
                                        />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </div>
                            </div>

                        </div>

                        {/* ----- TRAFFIC STATS CARDS (en Mo) ----- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <p className="text-gray-500">Total Sent</p>
                                <h3 className="text-3xl font-semibold">
                                    {totalReceivedMo.toFixed(2)} Mo
                                    <div className="text-sm text-gray-600">
                                        ({totalReceivedMoFromBytes.toFixed(2)} Mo calculé depuis bytes)
                                    </div>
                                </h3>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <p className="text-gray-500">Total Received</p>
                                <h3 className="text-3xl font-semibold">
                                    {totalSentMo.toFixed(2)} Mo
                                    <div className="text-sm text-gray-600">
                                        ({totalSentMoFromBytes.toFixed(2)} Mo calculé depuis bytes)
                                    </div>
                                </h3>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow text-center">
                                <p className="text-gray-500">Total Traffic</p>
                                <h3 className="text-3xl font-semibold">
                                    {totalTrafficMo.toFixed(2)} Mo
                                </h3>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard