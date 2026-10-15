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

    def create(self, key: str, country: Country) -> bool:     
        if key in self.countries:
            return False
        
        self.countries[key] = country
        return True

    def update(self, key: str, country: Country) -> bool:      
        if not key in self.countries:
            return False        
        
        self.countries[key] = country
        return True

    def delete(self, key: str) -> bool: 
        if key in self.countries:
            del self.countries[key]
            return True
        
        return False