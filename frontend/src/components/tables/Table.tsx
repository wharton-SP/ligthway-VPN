import { useEffect, useRef, useState, type JSX } from "react";
import { CopyPlus, FileQuestion, Info, Loader, Trash } from "lucide-react";
import { Button, Form, Input, useDisclosure } from "@heroui/react";
import ModalComponent from "../modals/Modal";
import { add_peers, delete_peers, get_peer, get_peers } from "../../services/Peers";
import { QRCodeCanvas } from "qrcode.react";

interface propsType {
  data: any[];
  setData : (data : any[]) => void;
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
      const message = await delete_peers(name)

      setLoading(true)
      await new Promise(res => setTimeout(res,2000))
      // const update = await get_peers()
      // setData(update.peers)
      alert(message.message);
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
                  <th className="bg-gray-200"> Reveived</th>
                  <th className="bg-gray-200"> Sent</th>
                  <th className="bg-gray-200"> Total</th>
                  <th className="bg-gray-200"> Status</th>
                  <th className="bg-gray-200"> HandShake Duration</th>
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
                    <td>{item.metrics.traffic.received_mb ? item.metrics.traffic.received_mb : 0 } mb</td>
                    <td>{item.metrics.traffic.sent_mb ? item.metrics.traffic.sent_mb : 0 } mb</td>
                    <td>{item.metrics.traffic.total_mb ? item.metrics.traffic.total_mb : 0 } mb</td>
                    <td className="group-hover:bg-gray-100 px-2 py-1">
                      <div className={` text-white ${item.metrics.is_active ? 'bg-blue-500' : 'bg-gray-400'} w-20 text-center rounded-2xl pb-[1.5px]`}>
                        {item.metrics.status}
                      </div>
                    </td>
                    <td>{item.metrics.time_since_handshake ? item.metrics.time_since_handshake : "-" }</td>
                    <td className="rounded-r-lg group-hover:bg-gray-100">
                      <div className="flex flex-row justify-between mx-8">
                        <button
                          className="text-blue-400 hover:cursor-pointer hover:text-blue-500"
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
                  Aucune donnée disponible
                </div>
                <p className="text-sm text-gray-400">
                  Les données de peers ici une fois disponible
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
                  <div className="mb-4 font-bold">
                    QR_Code :
                  </div>
                  <div className="flex flex-col place-items-center">
                    <QRCodeCanvas
                      value={qr}
                      size={260}
                    />
                  </div>
                  <div className="flex flex-row justify-center mt-2 mb-6">
                    Scan to import Wireguard config
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
