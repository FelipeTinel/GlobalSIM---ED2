import { el } from '../shared/dom.js';

export function createActionButtons(id, { onEdit, onDelete }) {
    const wrapper = el('div', 'item-actions');

    const editBtn = el('button', 'btn-edit', 'Editar');
    editBtn.type = 'button';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onEdit(id);
    });

    const deleteBtn = el('button', 'btn-delete', 'Excluir');
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(id);
    });

    wrapper.append(editBtn, deleteBtn);
    return wrapper;
}