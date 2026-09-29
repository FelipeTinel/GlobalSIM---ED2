class CountriesManager:

    def __init__(self):
        self.countries: dict[str, dict] = {}

    def register(self, key: str, country: dict) -> bool:
        
        if key in self.countries:
            return False
        
        self.countries[key] = country
        return True

    def update(self, key: str, country: dict) -> bool:
        
        if not key in self.countries:
            return False        
        
        self.countries[key] = country
        return True

    def delete(self, key: str) _> bool:
        
        if key in self.countries:
            del self.countries[key]
            return True
        
        return False