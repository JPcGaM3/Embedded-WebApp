import { FaTemperatureHalf } from "react-icons/fa6";
import { GiFertilizerBag } from "react-icons/gi";
import { MdEmojiEmotions, MdOutlineLightMode } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import Image from "next/image";
import { useEffect, useRef } from "react";

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
  },
];

export default function Home() {
  const videoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Set up video streaming
    if (videoRef.current) {
      videoRef.current.src = "http://localhost:5000/video_feed"; // Flask backend video stream URL
    }
  }, []);

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
        <div className="m-10 w-2/3 h-[400px] rounded-[2rem] border-4 border-black"></div>
      </div>
      <div className="px-20 flex justify-between flex-row flex-wrap">
        {mockData.map((item, index) => (
          <div
            key={index}
            className="my-6 w-44 h-44 border-4 border-black rounded-[2rem] relative"
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
