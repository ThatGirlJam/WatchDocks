import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import CardContent from "../components/ui/CardContent";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ActivityEntry = {
  time: string;
  "Front Entrance": number;
  "Bike Rack North": number;
};

type HeatmapData = {
  [location: string]: number[][];
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function getColor(value: number) {
  const colors = [
    "bg-gray-100",
    "bg-green-100",
    "bg-green-300",
    "bg-green-500",
    "bg-green-700",
    "bg-green-900",
  ];
  return colors[Math.min(value, colors.length - 1)];
}

export default function Review() {
  const [activityData, setActivityData] = useState<ActivityEntry[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({
    "Front Entrance": [],
    "Bike Rack North": [],
  });

  useEffect(() => {
    // Generate daily data (15-min intervals)
    const generateLineData = () => {
      const data: ActivityEntry[] = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const timeString = `${String(hour).padStart(2, "0")}:${String(
            minute
          ).padStart(2, "0")}`;
          data.push({
            time: timeString,
            "Front Entrance": Math.floor(Math.random() * 6),
            "Bike Rack North": Math.floor(Math.random() * 6),
          });
        }
      }
      return data;
    };

    // Generate weekly × hourly data for heatmap
    const generateHeatmapData = (): HeatmapData => {
      const data: HeatmapData = {
        "Front Entrance": [],
        "Bike Rack North": [],
      };

      for (let day = 0; day < 7; day++) {
        const rowFE: number[] = [];
        const rowBR: number[] = [];
        for (let hour = 0; hour < 24; hour++) {
          const base =
            (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 3 : 1;
          rowFE.push(base + Math.floor(Math.random() * 3)); // Range: 1–5
          rowBR.push(base + Math.floor(Math.random() * 3));
        }
        data["Front Entrance"].push(rowFE);
        data["Bike Rack North"].push(rowBR);
      }

      return data;
    };

    setActivityData(generateLineData());
    setHeatmapData(generateHeatmapData());
  }, []);

  return (
    <div className="p-6 grid gap-6">
      {/* Line Chart */}
      <Card className="col-span-1 md:col-span-2" title="Review Statistics">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">
            📈 Alert Activity by Location (Today)
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Front Entrance"
                stroke="#3b82f6"
                name="Front Entrance"
              />
              <Line
                type="monotone"
                dataKey="Bike Rack North"
                stroke="#10b981"
                name="Bike Rack North"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="col-span-1 md:col-span-2" title="Monthly Heatmap">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">
            🔥 Alert Activity by Location (Monthly)
          </h2>

          {Object.entries(heatmapData).map(([location, matrix]) => (
            <div key={location} className="mb-10">
              <h3 className="text-lg font-medium mb-2">{location}</h3>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[80px_repeat(24,1fr)] gap-1 text-xs">
                  {/* Header Row */}
                  <div></div>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="text-center font-medium text-gray-600"
                    >
                      {hour}
                    </div>
                  ))}

                  {/* Data Rows */}
                  {matrix.map((row, rowIndex) => (
                    <>
                      <div
                        key={`day-${rowIndex}`}
                        className="text-right font-medium pr-2 text-gray-700"
                      >
                        {days[rowIndex]}
                      </div>
                      {row.map((val, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`h-6 ${getColor(
                            val
                          )} rounded-sm transition-colors duration-200`}
                          title={`Alerts: ${val}`}
                        />
                      ))}
                    </>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
