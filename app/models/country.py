from typing import TypedDict

class Country(TypedDict):
    code: str
    country: str
    continent: str
    provider: str
    tech: str

class CountriesManager:

    def __init__(self):
        self.countries: dict[str, Country] = {}

    def create(self, key: str, country: Country) -> None: 
        if not key.strip():
            raise ValueError('Não pode chave vazia')

        if not country.get("code", "").strip():
            raise ValueError('Código inválido')

        if key in self.countries:
            raise KeyError('País existente')
        self.countries[key] = country

    def update(self, key: str, country: Country) -> None:      
        if key not in self.countries:
            raise KeyError('País não existente')
        self.countries[key] = country

    def delete(self, key: str) -> None: 
        if key in self.countries:
            del self.countries[key]
        else:
            raise KeyError('País não existente')
        