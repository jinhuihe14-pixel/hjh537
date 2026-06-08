
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/Login";
import CharacterPage from "@/pages/Character";
import GamePage from "@/pages/Game";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}
