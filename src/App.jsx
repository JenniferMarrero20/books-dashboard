import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import BookDetail from "./BookDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/book/:workId" element={<BookDetail />} />
    </Routes>
  );
};

