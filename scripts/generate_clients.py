import json
import random
import unicodedata
from pathlib import Path

TEAM_FIXED_NAMES = [
    ("Felipe", "Tinel"),
    ("Mirella", "Costa"),
    ("Enzo", "Schubach"),
    ("Maria Inés", "Restovic"),
]

NAMES = [
    "Maria", "João", "Ana", "Carlos", "Beatriz", "Lucas", "Fernanda", "Pedro",
    "Juliana", "Gabriel", "Mariana", "Rafael", "Camila", "Matheus", "Larissa",
    "Thiago", "Amanda", "Bruno", "Letícia", "Felipe", "Sofia", "Rodrigo",
    "Carla", "Diego", "Patricia", "Gustavo", "Vanessa", "Leonardo", "Bruna", "Eduardo",
    "Mirella", "Enzo"
]

SURNAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
    "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha",
    "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado",
    "Tinel", "Schubach", "Restovic"
]

DEFAULT_PACKAGES = [101, 102, 103, 104, 105, 201, 202, 203, 301]
STATUS_OPTIONS = ["ativo", "ativo", "ativo", "inativo"]


def load_available_countries(project_root: Path) -> list[str]:
    countries_path = project_root / "app" / "data" / "countries.json"
    if countries_path.exists():
        try:
            with open(countries_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                codes = [item["code"].strip().upper() for item in data if "code" in item and item["code"].strip()]
                if codes:
                    return codes
        except Exception:
            pass
    return ["BR", "US", "ES", "PT", "IT", "CA", "JP", "KR", "CR"]


def generate_clients(total: int = 1000, output_path: Path = None):
    project_root = Path(__file__).resolve().parent.parent
    if output_path is None:
        output_path = project_root / "app" / "data" / "clients.jsonl"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    available_countries = load_available_countries(project_root)

    unique_ids = random.sample(range(10000, 100000), total)

    name_pairs = list(TEAM_FIXED_NAMES)
    while len(name_pairs) < total:
        name_pairs.append((random.choice(NAMES), random.choice(SURNAMES)))

    with open(output_path, "w", encoding="utf-8") as f:
        for client_id, (first_name, last_name) in zip(unique_ids, name_pairs):
            full_name = f"{first_name} {last_name}"
            
            first_name_ascii = unicodedata.normalize('NFKD', first_name.lower()).encode('ASCII', 'ignore').decode('utf-8').replace(' ', '.')
            last_name_ascii = unicodedata.normalize('NFKD', last_name.lower()).encode('ASCII', 'ignore').decode('utf-8').replace(' ', '.')
            email = f"{first_name_ascii}.{last_name_ascii}{client_id % 1000}@email.com"
            esim = f"ESIM-{random.randint(10000, 99999)}"
            package = random.choice(DEFAULT_PACKAGES)
            country = random.choice(available_countries)
            status = random.choice(STATUS_OPTIONS)

            record = {
                "id": client_id,
                "name": full_name,
                "email": email,
                "esim": esim,
                "pkg": package,
                "country": country,
                "status": status
            }

            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    print(f"Success! {total} clients generated in: {output_path}")


if __name__ == "__main__":
    generate_clients()
