"use client";
import { useEffect, useRef, useState } from "react";
import { FaTemperatureHalf } from "react-icons/fa6";
import { GiFertilizerBag } from "react-icons/gi";
import { MdEmojiEmotions, MdOutlineLightMode } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";
import { BiSolidCameraOff } from "react-icons/bi"; // Import BiSolidCameraOff

const mockData = [
  {
    icon: <FaTemperatureHalf className="w-6 h-6" />,
    title: "Temperature",
    value: "25°C",
  },
  {
    icon: <MdOutlineLightMode className="w-6 h-6" />,
    title: "Light",
    value: "50%",
  },
  {
    icon: <WiHumidity className="w-8 h-8" />,
    title: "Humidity",
    value: "60%",
  },
  {
    icon: <GiFertilizerBag className="w-6 h-6" />,
    title: "Fertilizer",
    value: "50%",
  },
  {
    icon: <MdEmojiEmotions className="w-6 h-6" />,
    title: "Status",
    value: "Good",
    statusColor: "bg-green-100",
  },
];

export default function Home() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    if (isCameraOpen) {
      getCamera();
    } else {
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraOpen]);

  return (
    <div className="h-screen">
      <div className="flex flex-row">
        <div className="m-10 w-1/3 h-[400px] border-4 border-black rounded-[2rem]">
          <Image
            src="/tree.gif"
            alt="Description of GIF"
            width={400}
            height={400}
            className="rounded-[2rem] object-cover w-full h-full"
          />
        </div>
        <div className="m-10 w-2/3 h-[400px] rounded-[2rem] border-4 border-black relative">
          {isCameraOpen ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full rounded-[2rem] object-cover"
            />
          ) : (
            <p className="text-center mt-4">Camera is off</p>
          )}
          <div
            className="flex justify-center items-center absolute bottom-0 right-0 mb-4 mr-4 w-12 h-12 rounded-full border-4 border-black bg-white cursor-pointer"
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
      <div className="px-20 flex justify-between flex-row flex-wrap">
        {mockData.map((item, index) => (
          <div
            key={index}
            className={`my-6 w-44 h-44 border-4 border-black rounded-[2rem] relative ${
              item.title === "Status" ? item.statusColor : ""
            }`}
          >
            <div className="flex justify-center items-center absolute top-[-1.25rem] left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-4 border-black bg-white">
              {item.icon}
            </div>
            <div className="flex justify-center items-center mt-10">
              <div className="text-center flex justify-center items-center flex-col mt-4">
                <p className="font-semibold">{item.title}</p>
                <h1 className="text-2xl font-bold">{item.value}</h1>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
