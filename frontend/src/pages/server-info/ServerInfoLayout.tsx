import { useEffect, useState, type JSX } from 'react'
import { get_server_info } from '../../services/Peers'
import type { responseServInfo } from '../../types/Types'
import { useOutletContext } from 'react-router-dom'


function ServerInfoLayout() : JSX.Element {

  const [info , setInfo] = useState <responseServInfo | null> (null)
  useEffect(()=>{
    const fetch_info = async ()=>{
      const inf = await get_server_info();
      if (inf) setInfo(inf)
    }

    fetch_info();
  } , [])

  useEffect(()=>{
    console.log(info)
  } , [info])

  return (
    // <div className='text-pink-400'>
    //   teststststst
    // </div>
    <>
    <div className='h-full w-full'>
      <div className=' h-full w-full'>
        <div className='text-xl text-gray-500 my-6 mt-12 mr-8 flex flex-col items-center' >
          Server-Information
        </div>
        <div className=' h-full w-full flex flex-col items-center'>
          <div className='bg-gray-200 mt-12 px-8 py-12 rounded-xl font-semibold'>
            <div className='py-2'>Existing Peer counts : <a className='font-normal text-gray-600'>{info ? info.existing_peers_count : '  -'}</a></div>
            <div className='py-2'>Server public Key : <a className="text-blue-500 font-normal">{(info && info.publickey_server_exists) ? info.server_public_key : '  -'}</a></div>
            <div className='py-2'>WIREGUARD path : <a className="text-gray-600">{(info && info.wg0_conf_exists) ? info.wireguard_path : '   -'}</a></div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default ServerInfoLayout
