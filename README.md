# GlobalSIM — Serviço Internacional de Internet por eSIM (ED II)

Aplicação Web desenvolvida em **Python/Flask** para gerenciamento de cobertura internacional de pacotes eSIM, clientes e rotas de rede, aplicando e instrumentando estruturas de dados estudadas na disciplina **Estruturas de Dados II**.

---

## Identificação

- **Instituição:** Universidade do Estado da Bahia (UNEB) — DCET/I — Sistemas de Informação
- **Disciplina:** Estruturas de Dados II
- **Docente:** Prof. Maria Inés Restovic
- **Equipe:**
  - Enzo Schubach
  - Felipe Tinel
  - Mirella Costa

---

## Como Executar o Projeto

### 1. Criar e ativar o ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 3. Iniciar o servidor Flask

```bash
python run.py
```

Acesse no navegador:
- **Página Inicial e Consulta de Cobertura:** `http://127.0.0.1:5000/`
- **Painel Administrativo e Instrumentação da Tabela Hash:** `http://127.0.0.1:5000/admin/`

### 4. Executar os testes automatizados

```bash
pytest
```