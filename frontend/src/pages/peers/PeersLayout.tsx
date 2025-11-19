import { useEffect, useState, type JSX } from 'react'
import Table from '../../components/tables/Table'
import { get_peers } from '../../services/Peers';
import { reload_wg } from '../../services/Wg';

function PeersLayout() : JSX.Element {

  const [data , setData] = useState<any[]>([]);
    useEffect(()=>
    {
        const fetch_peers = async () => {
            const peers = await get_peers();
            setData(peers.peers);
        } 

        const rload_wg = async () => {
          await reload_wg();
        }
        
        console.log("Fetching peers...");
        
        fetch_peers();

        const intervalId = setInterval(fetch_peers , 1000)
        const intervalId_wg = setInterval(rload_wg , 10000)

        console.log("poll" , data);

        return() => {
          clearInterval(intervalId)
          clearInterval(intervalId_wg)
        }
    } , [])
  
  return (
    <>
    <div className='h-full w-full'>
      <div className=' h-full w-full flex flex-col items-center'>
        <div className='text-xl text-gray-500 my-8 mr-12' >
          Peers
        </div>
        <div className=' h-full w-full'>
          <Table data={data} setData={setData}/>
        </div>
      </div>
    </div>
    </>
  )
}

export default PeersLayout