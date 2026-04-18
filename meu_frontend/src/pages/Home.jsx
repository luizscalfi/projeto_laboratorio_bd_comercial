import React from 'react';
import '../pages/styles/home.css';

function Home() {
  return (
    <div className="container">
      <h1 className="title">Visão Geral do Sistema</h1>

      <p className="subtitle">
        Bem-vindo ao sistema de gestão. Selecione uma opção no menu acima para começar.
      </p>

      <div className="card">
        <h3>💡 Dica do Dia</h3>
        <p>
          Lembre-se de abrir o caixa no início do expediente antes de registrar novas vendas!
        </p>
      </div>
    </div>
  );
}

export default Home;