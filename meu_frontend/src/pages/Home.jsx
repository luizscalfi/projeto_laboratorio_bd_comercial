import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
// Importa o arquivo JSON diretamente (certifique-se de que ele está na pasta src!)
import frasesData from '../frases.json'; 

function Home() {
  const [usuario, setUsuario] = useState(null);
  const [fraseDoDia, setFraseDoDia] = useState({ frase: '', autor: '' });

  useEffect(() => {
    // 1. Puxa o nome de quem está logado
    const userStr = localStorage.getItem('usuarioGestao');
    if (userStr) {
      setUsuario(JSON.parse(userStr));
    }

    // 2. Sorteia a frase motivacional
    if (frasesData && frasesData.length > 0) {
      const indiceSorteado = Math.floor(Math.random() * frasesData.length);
      setFraseDoDia(frasesData[indiceSorteado]);
    }
  }, []);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      
      <h1 style={{ color: '#2c3e50', fontSize: '36px', marginBottom: '10px' }}>
        Olá, <span style={{ color: '#3498db' }}>{usuario ? usuario.nome : 'Administrador'}</span>!
      </h1>
      <p style={{ color: '#7f8c8d', fontSize: '18px', marginTop: 0 }}>
        Bem-vindo ao Sistema de Gestão Comercial.
      </p>

      {/* CARD DA FRASE MOTIVACIONAL */}
      <div style={{ 
        marginTop: '50px', 
        padding: '40px', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        borderTop: '5px solid #2ecc71',
        position: 'relative'
      }}>
        
        {/* Ícone de aspas decorativo */}
        <div style={{ position: 'absolute', top: '-20px', left: 'calc(50% - 20px)', backgroundColor: '#2ecc71', color: 'white', borderRadius: '50%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Quote size={20} fill="currentColor" />
        </div>

        <h3 style={{ color: '#95a5a6', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', marginBottom: '20px' }}>
          Inspiração do Dia
        </h3>

        <p style={{ 
          fontSize: '24px', 
          fontStyle: 'italic', 
          color: '#34495e', 
          lineHeight: '1.5',
          margin: '0 0 20px 0'
        }}>
          "{fraseDoDia.frase}"
        </p>

        <div style={{ display: 'inline-block', borderBottom: '2px solid #ecf0f1', paddingBottom: '5px' }}>
          <strong style={{ color: '#2c3e50', fontSize: '16px' }}>
            {fraseDoDia.autor}
          </strong>
        </div>

      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <p style={{ color: '#bdc3c7', fontSize: '14px' }}>
          Navegue pelo menu superior para acessar o PDV, Caixa, Estoque e Relatórios.
        </p>
      </div>

    </div>
  );
}

export default Home;