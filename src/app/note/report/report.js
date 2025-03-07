import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement);

export default function Report() {
  const data = {
    labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4"],
    datasets: [
      {
        label: "Số lượng ghi chú",
        data: [10, 20, 15, 30],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📈 Thống kê ghi chú</h1>
      <Bar data={data} />
    </div>
  );
}
