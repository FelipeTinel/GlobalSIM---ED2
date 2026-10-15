from typing import TypedDict
from app.repository.country import CountryRepository

"""
OBS DE FELIPE TINEL EI EI AQUI EI!!!!!!!!!!11111! OLHA AQUI!!!1

Eu antes tinha feito a lógica somente pra funcionar a base de dicionários, coisa que não é mais
tãããããão dessa forma assim porque estamos nos comunicando diretamente com dataframes do pandas
agora. Nesse caso, vamos ter que reformular. Já importei ali o CountryRepository no construtor,
só falta implementar a lógica de criação de entidades, consultas e retornos de dicionários pro
routes.

"""

class Country(TypedDict):
    code: str
    country: str
    continent: str
    provider: str
    tech: str

class CountriesManager:

    def __init__(self):
        self.countries: dict[str, Country] = {}
        self.repo = CountryRepository()

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
        