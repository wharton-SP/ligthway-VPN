import { useEffect, useRef, useState, type JSX } from "react";
import { CopyPlus, Download, FileQuestion, Info, Loader, Trash } from "lucide-react";
import { Form, Input, useDisclosure } from "@heroui/react";
import ModalComponent from "../modals/Modal";
import { add_peers, delete_peers, get_peer} from "../../services/Peers";
import { QRCodeCanvas } from "qrcode.react";
import type { Peer, ServerData } from "../../types/Types";

interface propsType {
  data: Peer[];
  setData: React.Dispatch<React.SetStateAction<ServerData | null>>;
}

function Table({ data , setData }: propsType): JSX.Element {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const add = useDisclosure();
  const info = useDisclosure();
  const del = useDisclosure();
  const [peer , setPeer] = useState <string>()
  const [loading , setLoading] = useState <boolean>(false)
  const [errors , setErrors] = useState();
  const [qr , setQr] = useState("");
  const [ip ,setIp] = useState<string | null>("");

  function isArrayNotNull<T>(data: unknown): data is T[] {
    return Array.isArray(data) && data.length > 0;
  }

  async function add_peer (name : string) {
    try {
      setLoading(true)

      await add_peers(name);
      // await new Promise(res => setTimeout(res,2000))
      // const update = await get_peers();
      // setData(update.peers);
    } 
    catch (error) 
    {
      setLoading(false);
      console.log (error);
    }
    finally
    {
      setLoading(false);
      add.onClose();
      get_one_peer(name);
    }
  }

  async function get_one_peer (name : string) {
    try {
      info.onOpen()
      setLoading(true)
      const peer = await get_peer(name);
      await new Promise(res => setTimeout(res,2000))
      setQr(peer.config)
      setPeer(peer.peer_name)

      const addressMatch = peer.config.match(/Address\s*=\s*([^\n]+)/);
      const address = addressMatch ? addressMatch[1].trim() : null;

      setIp(address);
    } 
    catch (error) 
    {
      console.log(error)
    }
    finally
    {
      setLoading(false)
    }
  }

  async function del_peer (name : string) {
    try {
      await delete_peers(name)

      setLoading(true)
      await new Promise(res => setTimeout(res,2000))
      // const update = await get_peers()
      // setData(update.peers)
      // alert(message.message);
    } 
    catch (error) 
    {
      console.log (error);
    }
    finally 
    {
      setLoading(false)
      del.onClose();
    }
  }

  const download_conf = () : void =>{
    if (!qr) return ;

    const blob = new Blob([qr] , {type : "text/plain"})
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${peer}.conf`
    document.body.appendChild(a)
    a.click()
    a.remove();

    URL.revokeObjectURL(url)
  }

  const onSubmit = async (e : React.FormEvent<HTMLFormElement>) => 
  {
    e.preventDefault();
    if (peer) 
      add_peer(peer);
  }

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop =
        tableContainerRef.current.scrollHeight;
    }
  }, [data]);

  return (
    <>
      <div className="px-3 mt-4 pb-2 relative text-[16px] bg-gray-50">
        <div className="p-2 rounded-[12px] border-[2px] border-gray-200 shadow-md">
          <div
            ref={tableContainerRef}
            className="table_main h-[78vh] bg-gray-50 overflow-auto"
          >
            <table className="table table-fixed text-left  w-full  p-[1rem] border-collapse">
              <thead className="">
                <tr className="sticky text-gray-500 z-12 top-0 left-0 text-sm rounded-xl">
                  <th className="rounded-tl-lg bg-gray-200 rounded-bl-lg">
                    Name
                  </th>
                  <th className="bg-gray-200"> Status</th>
                  <th className="bg-gray-200"> Traffic</th>
                  <th className="bg-gray-200"> BandWidth</th>
                  <th className="bg-gray-200"> Latest HandShake</th>
                  <th className="rounded-r-lg w-fit bg-gray-200"></th>
                </tr>
              </thead>

              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={idx}
                    className="group text-sm font-normal text-gray-800"
                  >
                    <td className="rounded-l-lg group-hover:bg-gray-100 px-2 py-1">
                      {item.name}
                    </td>
                    <td className="group-hover:bg-gray-100 px-2 py-1">
                      <div className={` text-white ${item.metrics.is_active ? 'bg-blue-500' : 'bg-gray-400'} w-20 text-center rounded-2xl pb-[1.5px]`}>
                        {item.metrics.status}
                      </div>
                    </td>
                    <td className="group-hover:bg-gray-100 px-2 py-1">
                      <div>
                        Received: {item?.metrics?.traffic?.received_mb ?? 0 } Mb
                      </div>
                      <div>
                        Sent: {item?.metrics?.traffic?.sent_mb ?? 0 } Mb
                      </div>
                      <div>
                        Total: {item?.metrics?.traffic?.total_mb ?? 0 } Mb
                      </div>
                    </td>
                    <td className="group-hover:bg-gray-100 px-2 py-1">
                      <div>
                        Received: {item?.bandwidth?.recv_kbps ?? 0 } Mbps
                      </div>
                      <div>
                        Sent: {item?.bandwidth?.sent_mbps ?? 0 } Mbps
                      </div>
                    </td>
                    <td className="group-hover:bg-gray-100 px-2 py-1">{item?.metrics?.time_since_handshake ?? "- - -" }</td>
                    <td className="rounded-r-lg group-hover:bg-gray-100">
                      <div className="flex flex-row justify-center mx-8">
                        <button
                          className="text-blue-400 hover:cursor-pointer hover:text-blue-500 mr-6"
                          onClick={() => {
                            if (item.name)
                              get_one_peer(item.name)
                          }}
                        >
                          <Info size={18} />
                        </button>
                        <button className=" text-red-400 hover:text-red-500 hover:cursor-pointer" onClick={()=>{
                          setPeer(item.name)
                          del.onOpen()
                        }}>
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                </tr>
              </tbody>
            </table>
            {!isArrayNotNull(data) && (
              <div className="flex flex-col items-center justify-center w-full h-[50vh] text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileQuestion className="text-gray-400" size={32} />
                </div>
                <div className="text-lg font-medium">
                  No data available
                </div>
                <p className="text-sm text-gray-400">
                  The data of peers whill appear here once available
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="btn_place absolute bottom-0 right-0 pb-2 pr-[12px]">
          <button
            className="btn_style flex flex-row items-center justify-center bg-blue-400 px-4 py-2 w-full rounded-tl-[7px] rounded-br-[7px] text-white hover:bg-blue-500 hover:cursor-pointer"
            onClick={() => {
              add.onOpen();
            }}
          >
            <CopyPlus size={17} />
            <p className="ml-1">New Peer</p>
          </button>
        </div>
      </div>

      <ModalComponent disclosure={add} header="New Peer">
        <>
            <div className="flex flex-col w-full mb-2">
              <Form
                className="w-full flex flex-col gap-3"
                validationErrors={errors}
                onSubmit={onSubmit}
              >
                <Input
                  type="text"
                  radius="sm"
                  label="Peer Name :"
                  labelPlacement="outside"
                  name="username"
                  placeholder="Enter your username"
                  onChange={(e)=>{setPeer(e.target.value)}}
                />
                <div className=" pt-8 w-full flex flex-row justify-end ">
                  <button className="py-1 px-6 rounded-lg text-sm bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-400 disabled:bg-blue-300" 
                    disabled={loading}
                    type="submit"
                  >
                    {!loading && 'Validate'}
                    {loading && (
                      <div className="flex flex-row">
                          <Loader className=" animate-[spin_2s_linear_infinite] mt-[3px]" size={15}/>
                          <div className="ml-2">Loading ...</div>
                      </div>
                    )}
                  </button>
                </div>
              </Form>
            </div>
        </>
      </ModalComponent>

      <ModalComponent disclosure={info} header="Peer Information">
        <>
          <div>
            {loading && (
                <div className="flex flex-row justify-center mb-6 text-lg">
                    <Loader className=" animate-[spin_2s_linear_infinite] mt-[8px]" size={15}/>
                    <div className="ml-2">Loading ...</div>
                </div>
            )}
            {
              !loading && (
                <>
                  <div className="font-semibold mb-2">
                    Peer Name : "{peer}"
                  </div>
                  <div className="mb-2 font-bold">
                    Address : {ip}
                  </div>
                  <div className="mb-4 font-bold">
                    QR_Code :
                  </div>
                  <div className="flex flex-col place-items-center">
                    <QRCodeCanvas
                      value={qr}
                      size={260}
                    />
                  </div>
                  <div className="flex flex-row justify-center mt-2 mb-4">
                    Scan to import Wireguard config
                  </div>
                  <div className="flex flex-row justify-end mb-6">
                      <button 
                        onClick={()=>{
                          download_conf()
                        }}
                        className="bg-blue-500 text-white rounded-lg px-3 py-1 flex flex-row hover:bg-blue-600 hover:cursor-pointer"
                      >
                        <Download className="mr-2" size={18}/>
                        download conf file
                      </button>  
                  </div>             
                </>
              )
            }
          </div>
        </>
      </ModalComponent>

      <ModalComponent disclosure={del} header="Delete Peer">
        <>
            <div className="flex flex-col w-full pb-2">
                <div className="">
                  Are you sure about deleting Peer: "{peer}"  ?
                </div>
                <div className=" pt-8 w-full flex flex-row justify-end ">
                  <button className="py-1 px-6 rounded-lg text-sm bg-gray-700 text-white hover:cursor-pointer hover:bg-gray-600 mr-3"
                    onClick={del.onClose}
                  >
                    Cancel
                  </button>
                  <button className="py-1 px-6 rounded-lg text-sm bg-blue-500 text-white hover:cursor-pointer hover:bg-blue-400 disabled:bg-blue-300" 
                    disabled={loading}
                    onClick={()=>{
                      if (peer) del_peer(peer);
                    }
                  }>
                    {!loading && 'Validate'}
                    {loading && (
                      <div className="flex flex-row">
                          <Loader className=" animate-[spin_2s_linear_infinite] mt-[3px]" size={15}/>
                          <div className="ml-2">Loading ...</div>
                      </div>
                    )}
                  </button>
                </div>
            </div>
        </>
      </ModalComponent>
    </>
  );
}

export default Table;
