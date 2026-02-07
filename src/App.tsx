import React, { useState } from 'react';

const App = () => {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);

  return (
    <div>
      <h1>Available Halls for Reservation</h1>
      <ul>
        {salas.map((sala) => (
          <li key={sala.id}>{sala.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default App;