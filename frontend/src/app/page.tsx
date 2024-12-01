"use client";
import { useEffect, useRef, useState } from "react";
import { FaTemperatureHalf } from "react-icons/fa6";
import { GiFertilizerBag } from "react-icons/gi";
import { MdEmojiEmotions, MdOutlineLightMode } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";
import { BiSolidCameraOff } from "react-icons/bi";

interface Logs {
  Client: {
    timestamp: string;
    soilMoist: number;
    ultrasonic: number;
    waterPump: boolean;
  }[];
  Server: {
    timestamp: string;
    humidity: number;
    lightValue: number;
    temperature: number;
    lightStatus: string;
    Status: string;
  }[];
}
interface Data {
  Client: {
    timestamp: string;
    soilMoist: number;
    ultrasonic: number;
    waterPump: boolean;
  };
  Server: {
    timestamp: string;
    humidity: number;
    lightValue: number;
    temperature: number;
    lightStatus: string;
    Status: string;
  };
}

const initialData: Data = {
  Client: {
    timestamp: "",
    soilMoist: 0,
    ultrasonic: 0,
    waterPump: false,
  },
  Server: {
    timestamp: "",
    humidity: 0,
    lightValue: 0,
    temperature: 0,
    lightStatus: "",
    Status: "",
  },
};

export default function Home() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLImageElement | null>(null);
  const [data, setData] = useState<Data>(initialData);
  const [logs, setLogs] = useState<Logs>({ Client: [], Server: [] });
  const [status, setStatus] = useState({
    status: "Calculating...",
    color: "white",
  });

  const fetchFirebaseData = async () => {
    try {
      const response = await fetch("http://localhost:8080/get_firebase_data");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Data = await response.json();
      console.log(data.Client.soilMoist);
      // Parse sensor values from Client and Server
      const waterPumpStatus = data.Client.waterPump; // "on" or "off"
      const plantStatus = data.Server.Status;

      // Default status and color
      let status = { status: "Calculating...", color: "bg-white" };

      if (plantStatus == "sad") {
        status = { status: "Sad", color: "bg-red-100" };
      } else if (plantStatus == "good") {
        status = { status: "Good", color: "bg-yellow-100" };
      } else if (plantStatus == "happy") {
        status = { status: "Happy", color: "bg-green-100" };
      }
      // Check water pump status to adjust status message
      if (waterPumpStatus) {
        status = { status: "Watering", color: "bg-blue-200" };
      }

      // Update UI state
      setStatus(status);
      setData(data);
    } catch (error) {
      console.error("Error fetching Firebase data:", error);
    }
  };

  const fetchFirebaseLogs = async () => {
    try {
      const response = await fetch("http://localhost:8080/get_firebase_logs");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Logs = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching Firebase logs:", error);
    }
  };

  useEffect(() => {
    fetchFirebaseData();
    fetchFirebaseLogs();
    const intervalId = setInterval(fetchFirebaseData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      videoRef.current.src = "http://localhost:8080/video_feed";
    } else if (videoRef.current) {
      videoRef.current.src = "";
    }
  }, [isCameraOpen]);

  const filterData = [
    {
      icon: <FaTemperatureHalf className="w-6 h-6" />,
      title: "Temperature",
      value: data.Server.temperature + "%",
    },
    {
      icon: <MdOutlineLightMode className="w-6 h-6" />,
      title: "Light",
      value: data.Server.lightStatus,
    },
    {
      icon: <WiHumidity className="w-8 h-8" />,
      title: "Humidity",
      value: data.Server.humidity + "%",
    },
    {
      icon: <GiFertilizerBag className="w-6 h-6" />,
      title: "Soil moist",
      value: data.Client.soilMoist + "%",
    },
    {
      icon: <MdEmojiEmotions className="w-6 h-6" />,
      title: "Status",
      value: status.status,
      statusColor: status.color,
    },
  ];

  return (
    <div className="gap-2 mt-4 mb-4 w-full h-full">
      <div className="flex flex-row gap-10 px-20">
        <div className="border-4 my-10 border-black rounded-[2rem] w-1/3 h-[400px]">
          <Image
            src="/tree.gif"
            alt="Description of GIF"
            width={400}
            height={400}
            className="rounded-[2rem] w-full h-full object-cover"
          />
        </div>
        <div className="relative border-4 my-10 border-black rounded-[2rem] w-2/3 h-[400px]">
          {isCameraOpen ? (
            <img
              ref={videoRef}
              alt="loading..."
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "2rem",
              }}
            />
          ) : (
            <p className="mt-4 text-center">Camera is off</p>
          )}
          <div
            className="right-0 bottom-0 absolute flex justify-center items-center border-4 bg-white mr-4 mb-4 border-black rounded-full w-12 h-12 cursor-pointer"
            onClick={() => setIsCameraOpen((prev) => !prev)}
          >
            {isCameraOpen ? (
              <FaCamera className="w-6 h-6" />
            ) : (
              <BiSolidCameraOff className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-between px-20">
        {filterData.map((item, index) => (
          <div
            key={index}
            className={`my-6 w-44 h-44 border-4 border-black rounded-[2rem] relative ${
              item.title === "Status" ? item.statusColor : ""
            } hover:scale-105 hover:shadow-xl ease-out duration-300`}
          >
            <div className="top-[-1.25rem] left-1/2 absolute flex justify-center items-center border-4 bg-white border-black rounded-full w-12 h-12 transform -translate-x-1/2">
              {item.icon}
            </div>
            <div className="flex justify-center items-center mt-10">
              <div className="flex flex-col justify-center items-center mt-4 text-center">
                <p className="font-semibold">{item.title}</p>
                <h1 className="font-bold text-2xl">{item.value}</h1>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Logs */}
      <div className="flex flex-row justify-center space-x-4 mb-4 px-20 w-full">
        <div className="w-[45%]">
          <h2 className="mt-10 font-bold text-center text-xl">Client Logs</h2>
          <table className="border-gray-300 bg-white mt-4 border min-w-full text-center">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Timestamp</th>
                <th className="px-4 py-2 border-b">Soil Moist</th>
                <th className="px-4 py-2 border-b">Ultrasonic</th>
                <th className="px-4 py-2 border-b">Water Pump</th>
              </tr>
            </thead>
            <tbody>
              {logs.Client.map((log, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border-b">{log.timestamp}</td>
                  <td className="px-4 py-2 border-b">{log.soilMoist}</td>
                  <td className="px-4 py-2 border-b">{log.ultrasonic}</td>
                  <td className="px-4 py-2 border-b">
                    {log.waterPump ? "On" : "Off"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-[45%]">
          <h2 className="mt-10 font-bold text-center text-xl">Server Logs</h2>
          <table className="border-gray-300 bg-white mt-4 border min-w-full text-center">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Timestamp</th>
                <th className="px-4 py-2 border-b">Humidity</th>
                <th className="px-4 py-2 border-b">Light Value</th>
                <th className="px-4 py-2 border-b">Temperature</th>
                <th className="px-4 py-2 border-b">Light Status</th>
                <th className="px-4 py-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.Server.map((log, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border-b">{log.timestamp}</td>
                  <td className="px-4 py-2 border-b">{log.humidity}</td>
                  <td className="px-4 py-2 border-b">{log.lightValue}</td>
                  <td className="px-4 py-2 border-b">{log.temperature}</td>
                  <td className="px-4 py-2 border-b">{log.lightStatus}</td>
                  <td className="px-4 py-2 border-b">{log.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
