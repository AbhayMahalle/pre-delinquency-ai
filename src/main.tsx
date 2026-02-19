import { createRoot } from "react-dom/client";
import { seedDefaultData } from "@/utils/seedData";
import App from "./App.tsx";
import "./index.css";

seedDefaultData();

createRoot(document.getElementById("root")!).render(<App />);
