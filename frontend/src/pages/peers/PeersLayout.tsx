import { useEffect, useState, type JSX } from 'react';
import Table from '../../components/tables/Table'
import { useOutletContext } from 'react-router-dom';
import type { Peer, ServerData } from '../../types/Types';
import { Input } from '@heroui/react';
import { Search } from 'lucide-react';


type OutletCtx = {
  data: ServerData | null;
  setData: React.Dispatch<React.SetStateAction<ServerData | null>>;
};

function PeersLayout() : JSX.Element {
  const {data,setData} = useOutletContext <OutletCtx>()
  const [peers , setPeers] = useState <Peer[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('');


  const filteredPeers = peers.filter((peer) => 
    peer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  
  useEffect(()=>{
    setPeers(data?.peers ?? []);
  } , [data])
  
  return (
    <>
    <div className='h-full w-full'>
      <div className=' h-full w-full flex flex-col items-center'>
        <div className='text-xl text-gray-500 my-6 mr-12' >
          Peers
        </div>
        <div className='flex flex-row w-full items-center px-4'>
          <div className='mt-3 mx-4 text-gray-500'>
            Total peers : {data?.summary?.total_peers ?? 0} | 
            Active : {data?.summary?.active_peers ?? 0} | 
            Inactive : {(data?.summary?.total_peers ?? 0) - (data?.summary?.active_peers ?? 0)}</div>
          <div className=" flex flex-row flex-1 h-full justify-end items-end">
              <div className="flex flex-row  text-gray-600 py-2 rounded-[12px] bg-gray-200 px-2 w-[12rem]">
                  <input
                      type="text"
                      placeholder="search peers"
                      className="w-[9rem] bg-transparent outline-none placeholder:text-gray-500 px-2"
                      onChange={(e) => {
                          setSearchTerm(e.target.value);
                      }}
                  />
                  <div className="mr-1  px-1 flex flex-row items-center cursor-pointer">
                      <Search size={18} />
                  </div>
              </div>
          </div>
        </div>
        <div className=' h-full w-full'>
          <Table data={filteredPeers} setData={setData}/>
        </div>
      </div>
    </div>
    </>
  )
}

export default PeersLayout