import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";


import Home from "./components/home";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App