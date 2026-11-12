import json
import random
from pathlib import Path

NOMES = [
    "Maria", "João", "Ana", "Carlos", "Beatriz", "Lucas", "Fernanda", "Pedro",
    "Juliana", "Gabriel", "Mariana", "Rafael", "Camila", "Matheus", "Larissa",
    "Thiago", "Amanda", "Bruno", "Letícia", "Felipe", "Sofia", "Rodrigo",
    "Carla", "Diego", "Patricia", "Gustavo", "Vanessa", "Leonardo", "Bruna", "Eduardo"
]

SOBRENOMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
    "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha",
    "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado"
]

PACOTES_PADRAO = [101, 102, 103, 104, 105, 201, 202, 203]
STATUS_OPCOES = ["ativo", "ativo", "ativo", "inativo"]


def gerar_clientes(total: int = 1000, caminho_saida: Path = None):
    if caminho_saida is None:
        raiz_projeto = Path(__file__).resolve().parent.parent
        caminho_saida = raiz_projeto / "app" / "data" / "clients.jsonl"

    caminho_saida.parent.mkdir(parents=True, exist_ok=True)

    ids_unicos = random.sample(range(10000, 100000), total)

    with open(caminho_saida, "w", encoding="utf-8") as f:
        for cliente_id in ids_unicos:
            nome = random.choice(NOMES)
            sobrenome = random.choice(SOBRENOMES)
            nome_completo = f"{nome} {sobrenome}"
            
            email = f"{nome.lower()}.{sobrenome.lower()}{cliente_id % 1000}@email.com"
            esim = f"ESIM-{random.randint(10000, 99999)}"
            pacote = random.choice(PACOTES_PADRAO)
            status = random.choice(STATUS_OPCOES)

            registro = {
                "id": cliente_id,
                "nome": nome_completo,
                "email": email,
                "esim": esim,
                "pacote": pacote,
                "status": status
            }

            f.write(json.dumps(registro, ensure_ascii=False) + "\n")

    print(f"Sucesso! {total} clientes gerados em: {caminho_saida}")


if __name__ == "__main__":
    gerar_clientes()
