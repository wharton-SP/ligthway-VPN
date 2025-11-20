import { ChartColumn, CloudLightning, Info, Link, Loader} from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import {
  NavBarLinksContainer,
  NavBarLinksContent,
} from "../components/navbar/NavbarLinks";
import { get_peers } from "../services/Peers";
import type { ServerData } from "../types/Types";

function MainLayout(): JSX.Element {
  const [loading, set_loading] = useState(true);
  const [data , setData] = useState <ServerData | null>(null)

  useEffect(()=>
  {
    const fetch_peers = async () => {
        const peers = await get_peers();
        setData(peers);
    } 

    // const rload_wg = async () => {
    //   await reload_wg();
    // }
    
    console.log("Fetching peers...");
    
    fetch_peers();

    const intervalId = setInterval(fetch_peers , 1000)
    // const intervalId_wg = setInterval(rload_wg , 10000)

    console.log("poll" , data);

    return() => {
      clearInterval(intervalId)
      // clearInterval(intervalId_wg)
    }
  } , [])

  useEffect(() => {
    const timer = setTimeout(() => {
      set_loading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen text-blue-400">
          <div className="mr-3">
            <CloudLightning size={70}/>
          </div>
          <div className="text-blue-400 mt-2 flex flex-row mr-3 text-xl font-medium">
            <Loader className="animate-[spin_2s_linear_infinite] text-blue-400 mr-2 mt-1" />
            <div>Loading ...</div>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="h-screen w-screen">
        <div className="flex flex-row h-full w-full justify-center">
          <div className="h-full w-60 border-r-[0.5px] border-gray-200">
            <Navbar>
              <NavBarLinksContainer>
                <div>
                  <NavBarLinksContent
                    icon={<ChartColumn size={18} />}
                    href="/"
                    text="Dashboard"
                  />

                  <NavBarLinksContent
                    icon={<Link size={18} />}
                    href="/peers"
                    text="Peers"
                  />

                  <NavBarLinksContent
                    icon={<Info size={16} />}
                    href="/logs"
                    text="Server-info"
                  />
                </div>
              </NavBarLinksContainer>
            </Navbar>
          </div>
          <div className="h-full w-full bg-gray-50">
            <Outlet context={{data,setData}} />
          </div>
        </div>
      </div>
    </>
  );
}

export default MainLayout;
