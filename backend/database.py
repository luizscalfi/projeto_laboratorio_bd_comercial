import psycopg2
import os
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def obter_conexao():
    """Abre e retorna a conexão com o banco de dados Supabase"""
    return psycopg2.connect(DATABASE_URL)