import pandas as pd
import os

"""
OBS DE FELIPE TINEL OLHA AQUI OI NÂO ME IGNORA ATENÇÂO !!!!!!!!111!

Isso aqui tá engessado, depois a gente vai ter que criar um repositório como classe abstrata e
fazer com que "CountryRepository" seja filho dele. Digo isso por que, eventualmente, vamos ter que
fazer tooooooda essa lógica também com Users. Não fiz isso direto por fins práticos.

Outra coisa, eu ainda não testei isso aqui direito. Dêm uma olhada certinho pra ver se faz sentido
ou se devemos mudar algum método ou coisa assim.

"""


class CountryRepository:

    def __init__(self, filepath="app/data/countries.csv"):
        self.filepath = filepath
        
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        
        if os.path.exists(self.filepath):
            self.df = pd.read_csv(self.filepath)

            if 'key' not in self.df.columns and not self.df.empty:
                self.df.insert(0, 'key', self.df['code'])
        else:
            self.df = pd.DataFrame(columns=['key', 'code', 'country', 'continent', 'provider', 'tech'])

    def save_to_csv(self):
        self.df.to_csv(self.filepath, index=False)

    def add(self, key: str, country_dict: dict) -> None:
        new_row = {'key': key, **country_dict}
        
        new_df = pd.DataFrame([new_row])
        self.df = pd.concat([self.df, new_df], ignore_index=True)
        self.save_to_csv()

    def get(self, key: str) -> dict | None:
        row = self.df[self.df['key'] == key]
        if row.empty:
            return None

        return row.iloc[0].drop('key').to_dict()

    def update(self, key: str, country_dict: dict) -> None:
        if key not in self.df['key'].values:
            raise KeyError('País não existente')
        
        for field, value in country_dict.items():
            self.df.loc[self.df['key'] == key, field] = value
        
        self.save_to_csv()

    def delete(self, key: str) -> None:
        if key not in self.df['key'].values:
            raise KeyError('País não existente')
        
        self.df = self.df[self.df['key'] != key]
        self.save_to_csv()

    def get_all(self) -> list[dict]:
        return self.df.to_dict(orient='records')