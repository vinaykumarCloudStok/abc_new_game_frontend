import React from 'react';
import './styles/global.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomeLayout from './components/home/HomeLayout';

const App: React.FC = () => {
  return (
  <BrowserRouter>
  <Routes>
    <Route path='/' element={<HomeLayout/>}/>
  </Routes>
  </BrowserRouter>
  );
};

export default App;
