"use client";
import { useEffect, useRef, useState } from "react";
import { FaTemperatureHalf } from "react-icons/fa6";
import { GiFertilizerBag } from "react-icons/gi";
import { MdEmojiEmotions, MdOutlineLightMode } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";
import { BiSolidCameraOff } from "react-icons/bi";

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
  },
};

export default function Home() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLImageElement | null>(null);
  const [data, setData] = useState<Data>(initialData);
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
      const lightValueValue = data.Server.lightValue;
      const soilMoisture = data.Client.soilMoist;
      const temperature = data.Server.temperature;
      const humidity = data.Server.humidity;
      const waterPumpStatus = data.Client.waterPump; // "on" or "off"

      // Default status and color
      let status = { status: "Calculating...", color: "bg-white" };

      if (
        lightValueValue < 100 ||
        soilMoisture < 30 ||
        temperature < 15 ||
        humidity < 40
      ) {
        data.Server.lightStatus = "Dark";
        status = { status: "Very Bad", color: "bg-red-400" };
      } else if (
        lightValueValue < 1000 ||
        soilMoisture < 40 ||
        temperature < 18 ||
        humidity < 50
      ) {
        data.Server.lightStatus = "Dim";
        status = { status: "Bad", color: "bg-red-100" };
      } else if (
        lightValueValue < 2000 ||
        soilMoisture < 60 ||
        temperature < 25 ||
        humidity < 60
      ) {
        data.Server.lightStatus = "Light";
        status = { status: "Moderate", color: "bg-yellow-100" };
      } else if (
        lightValueValue < 3200 &&
        soilMoisture <= 80 &&
        temperature <= 30 &&
        humidity <= 70
      ) {
        data.Server.lightStatus = "Bright";
        status = { status: "Good", color: "bg-green-100" };
      } else if (
        lightValueValue >= 3200 &&
        soilMoisture > 80 &&
        temperature > 30 &&
        humidity > 70
      ) {
        data.Server.lightStatus = "Very bright";
        status = { status: "Perfect", color: "bg-green-400" };
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

  useEffect(() => {
    fetchFirebaseData();
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
    <div className="h-screen">
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
    </div>
  );
}
