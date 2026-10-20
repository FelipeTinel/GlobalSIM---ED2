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

---

## Arquitetura do Projeto

A lógica das estruturas de dados e de persistência é totalmente desacoplada das rotas Flask:

```text
GlobalSIM---ED2/
├── run.py                          # Ponto de entrada da aplicação Flask
├── app/
│   ├── data/
│   │   └── countries.json          # Persistência em JSON dos países atendidos
│   ├── models/
│   │   ├── hash_table.py           # Implementação própria da Tabela Hash e instrumentação
│   │   └── country.py              # Gerenciador de domínio (CountriesManager)
│   ├── repository/
│   │   └── country.py              # Leitura e gravação em arquivo JSON (CountryRepository)
│   ├── routes/
│   │   ├── home.py                 # Rotas da página inicial e consulta de cobertura
│   │   └── admin.py                # Rotas administrativas (GET e POST com Post/Redirect/Get)
│   ├── templates/
│   │   ├── home.html               # Template Jinja da consulta de cobertura e mapa
│   │   └── admin.html              # Template Jinja do painel administrativo e instrumentação
│   ├── static/                     # Arquivos CSS e módulos JavaScript (Leaflet e UI)
│   └── tests/
│       └── test_country.py         # Testes automatizados da Tabela Hash, persistência e rotas
```

---

## Estrutura de Dados Implementada (Etapa 1 — Tabela Hash)

O gerenciamento dos países atendidos pela GlobalSIM e a consulta de cobertura por código (`BR`, `PT`, `ES`, `FR`, `IT`, `US`, `CA`, `JP`, etc.) utilizam uma **Tabela Hash** implementada do zero em `app/models/hash_table.py`.

### Decisões de Implementação

1. **Capacidade Inicial ($M = 11$):** Número primo escolhido para favorecer uma distribuição uniforme das chaves entre os buckets e permitir observar colisões reais mesmo com conjuntos moderados de países.
2. **Normalização de Chaves:** Os códigos dos países são normalizados com `strip().upper()`, garantindo buscas *case-insensitive* consistentes (ex.: `"it"` e `"IT"` mapeiam para o mesmo índice).
3. **Função de Espalhamento (`_hash`):** Hash polinomial com multiplicador primo $31$:
   $$h(k) = \left(\sum_{i=0}^{|k|-1} \text{hash\_prev} \cdot 31 + \text{ord}(k_i)\right) \bmod M$$
4. **Tratamento de Colisões:** **Encadeamento Separado (*Separate Chaining*)**, onde cada posição da tabela (`self.buckets[index]`) armazena uma lista encadeada de pares `(chave, valor)`.
5. **Persistência e Carga em Memória:** Na inicialização (`CountriesManager`), todos os registros de `app/data/countries.json` são carregados na `HashTable` em memória. Todas as operações de busca e listagem consultam diretamente a `HashTable`, e toda operação de alteração (`create`, `update`, `delete`) utiliza rotas `POST` (seguindo o padrão *Post/Redirect/Get*) e sincroniza o estado modificado no JSON.

### Instrumentação da Tabela Hash

O método `get_instrumentation()` expõe em tempo real no Painel Administrativo (`/admin/`):
- **Elementos ($N$):** Quantidade total de países armazenados.
- **Capacidade ($M$):** Total de buckets da tabela.
- **Fator de Carga ($\alpha = N / M$):** Grau de ocupação da estrutura.
- **Buckets Ocupados e Livres:** Distribuição espacial dos registros.
- **Total de Colisões:** Quantidade de chaves inseridas em buckets já ocupados.
- **Rastreamento da Última Busca:** Chave pesquisada, índice do bucket inspecionado (`#0` a `#10`) e quantidade exata de comparações realizadas na lista daquele bucket.

---

## Diferencial da Equipe (Descrição Inicial e Integração)

### Diferencial Escolhido: Árvore B Secundária para Agrupamento de Clientes por País

### Problema Resolvido
Na modelagem padrão do GlobalSIM (Etapa 2), a **Árvore B principal** indexa o grande volume de clientes (aproximadamente 1.000 registros) utilizando o `id` único do cliente como chave primária. Embora essa estrutura garanta buscas eficientes em $O(\log n)$ quando o `id` do cliente é conhecido, responder a consultas administrativas como *"Quais e quantos clientes estão utilizando eSIM em determinado país?"* exigiria uma varredura completa ($O(n)$) em todos os nós da Árvore B principal.

Para resolver esse problema de forma algorítmica e estrutural, a equipe implementará uma **Árvore B Secundária (Índice Secundário)** dedicada a agrupar os clientes por código de país.