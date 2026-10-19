export async function getCountries() {
    try {
        const response = await fetch('/admin/api/countries', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error("Erro ao buscar países");
        
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createCountry(countryData) {
    try {
        const response = await fetch('/admin/api/countries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(countryData)
        });

        if (!response.ok) throw new Error("Erro ao criar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export async function updateCountry(countryId, countryData) {
    try {
        const response = await fetch(`/admin/api/countries/${countryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(countryData)
        });

        if (!response.ok) throw new Error("Erro ao atualizar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export async function deleteCountry(countryId) {
    try {
        const response = await fetch(`/admin/api/countries/${countryId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Erro ao deletar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

let editingCountryId = null;

export async function loadCountryList() {
    const countries = await getCountries();
    const listaUl = document.getElementById('countries-list');
    listaUl.innerHTML = "";

    if (!countries || Object.keys(countries).length === 0) {
        listaUl.innerHTML = "<li style='padding: 8px 0; color: #64748b;'>Nenhum país cadastrado.</li>";
        return;
    }

    Object.entries(countries).forEach(([id, dados]) => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;";
        
        li.innerHTML = `
            <span style="cursor: pointer; flex-grow: 1;" class="country-item" data-id="${id}">
                <b>${id.toUpperCase()}</b> - ${dados.name || 'Sem nome'}
            </span>
            <button data-id="${id}" class="btn-delete" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Excluir</button>
        `;

        li.querySelector('.country-item').addEventListener('click', () => {
            editingCountryId = id;
            document.getElementById('country-id').value = id;
            document.getElementById('country-id').disabled = true;
            document.getElementById('country-name').value = dados.name || '';
            document.getElementById('country-lat').value = dados.lat || '';
            document.getElementById('country-lng').value = dados.lng || '';
            document.getElementById('country-continent').value = dados.continent || '';
            document.getElementById('country-provider').value = dados.provider || '';
            document.getElementById('country-tech').value = dados.tech || '';
        });

        li.querySelector('.btn-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteCountry(id);
            loadCountryList();
        });

        listaUl.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Painel do ADM funcional");
    loadCountryList();

    const form = document.getElementById('country-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const countryIdInput = document.getElementById('country-id');
        const countryId = countryIdInput.value.trim();
        
        const countryData = {
            code: countryId,
            name: document.getElementById('country-name').value.trim(),
            lat: parseFloat(document.getElementById('country-lat').value),
            lng: parseFloat(document.getElementById('country-lng').value),
            continent: document.getElementById('country-continent').value.trim(),
            provider: document.getElementById('country-provider').value.trim(),
            tech: document.getElementById('country-tech').value.trim()
        };

        const currentCountries = await getCountries();
        let existingKey = null;

        if (currentCountries && typeof currentCountries === 'object') {
            const foundKey = Object.keys(currentCountries).find(
                key => key.toLowerCase() === countryId.toLowerCase()
            );
            if (foundKey) {
                existingKey = foundKey;
            }
        }

        let result;

        if (editingCountryId || existingKey) {
            const targetId = editingCountryId || existingKey;
            result = await updateCountry(targetId, countryData);
        } else {
            result = await createCountry(countryData);
        }

        if (result !== null && result !== undefined) {
            form.reset();
            countryIdInput.disabled = false;
            editingCountryId = null;
            
            const submitBtn = document.querySelector('#country-form button[type="submit"]');
            if (submitBtn) submitBtn.textContent = "Salvar País";
            
            loadCountryList();
        } else {
            alert("Ocorreu um erro ao salvar os dados. Verifique o console.");
        }
    });
});