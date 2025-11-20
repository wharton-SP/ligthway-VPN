import { useEffect, useMemo, useState, type JSX } from "react"
import type { ServerData, Summary } from "../../types/Types"
import { data, useOutletContext } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { FileQuestion } from "lucide-react";

type OutletCtx = {
    data: ServerData | null;
}

const COLORS = ["#60a5fa", "#f87171"]; // blue-500, red-400

function Dashboard() : JSX.Element {
    const [summary , setSummary] = useState<Summary | null>(null)
    const {data} = useOutletContext<OutletCtx>()


    useEffect(()=>{
        setSummary(data?.summary ?? null);

        console.log("summary:" , summary);
    } , [data])



    if (!summary) return (
        <>
        </>
    )

  const peersData = [
    { name: "Active Peers", value: summary.active_peers },
    { name: "Inactive Peers", value: summary.inactive_peers },
  ];

  const bandwidthData = [
    { name: "Recv (Mbps)", value: summary.current_bandwidth_recv_mbps },
    { name: "Sent (Mbps)", value: summary.current_bandwidth_sent_mbps },
    { name: "Total (Mbps)", value: summary.current_bandwidth_total_mbps },
  ];
  return (
    <>
      <div className=''>
        <div className='text-xl text-gray-500 my-6 mt-12 mr-8 flex flex-col items-center' >
          DashBoard
        </div>
        <div className=' h-64 w-full '>
            <div className="p-6 flex flex-col gap-8">

                {/* ----- PEERS + BANDWIDTH SECTION ----- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* PIE CHART: ACTIVE VS INACTIVE */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-4">Peers Status</h2>

                        <div className="w-full h-80 flex flex-col items-center justify-center">
                            {
                                summary.total_peers  ?
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
                                    // isAnimationActive={summary.total_peers > 0}
                                    // animationDuration={5000}
                                    // animationBegin={0}
                                    // animationEasing="ease-out"
                                    // startAngle={90}
                                    // endAngle={450}
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
                                                <FileQuestion size={25}/>
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

                    {/* BANDWIDTH BAR CHART */}
                    <div className="bg-white p-4 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-4">Current Bandwidth</h2>

                        <div className="flex flex-col items-center">
                            <BarChart width={350} height={300} data={bandwidthData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" />
                            </BarChart>
                        </div>
                    </div>

                </div>

                {/* ----- TRAFFIC STATS CARDS ----- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="bg-white p-6 rounded-xl shadow text-center">
                    <p className="text-gray-500">Total Received (GB)</p>
                    <h3 className="text-3xl font-semibold">
                        {summary.total_received_gb}
                        <div className="text-sm text-gray-600">({summary.total_received_bytes} bytes)</div>
                    </h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow text-center">
                    <p className="text-gray-500">Total Sent (GB)</p>
                    <h3 className="text-3xl font-semibold">
                        {summary.total_sent_gb}
                        <div className="text-sm text-gray-600">({summary.total_sent_bytes} bytes)</div>    
                    </h3>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow text-center">
                    <p className="text-gray-500">Total Traffic (GB)</p>
                    <h3 className="text-3xl font-semibold">{summary.total_traffic_gb}</h3>
                    </div>

                </div>

            </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
