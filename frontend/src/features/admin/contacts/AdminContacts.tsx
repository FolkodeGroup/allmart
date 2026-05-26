import { useState, useEffect } from 'react';
import { contactsService } from '../../../services/contactsService';
import styles from './AdminContacts.module.css';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  isFlagged: boolean;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');

  useEffect(() => {
    loadContacts();
  }, [page, limit, statusFilter, flaggedFilter, searchQuery]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await contactsService.listContacts(
        page,
        limit,
        statusFilter || undefined,
        flaggedFilter ? true : undefined,
        searchQuery || undefined
      );
      setContacts(result.data);
      setTotal(result.pagination.total);
      setPages(result.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      await contactsService.updateContact(contactId, { status: newStatus });
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  const handleFlagToggle = async (contactId: string, isFlagged: boolean) => {
    try {
      await contactsService.updateContact(contactId, { isFlagged: !isFlagged });
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar bandera');
    }
  };

  const handleOpenNotes = (contact: Contact) => {
    setSelectedContact(contact);
    setModalNotes(contact.adminNotes || '');
    setShowModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    try {
      await contactsService.updateContact(selectedContact.id, { adminNotes: modalNotes });
      setShowModal(false);
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Error al guardar notas');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) return;
    try {
      await contactsService.deleteContact(contactId);
      loadContacts();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar contacto');
    }
  };

  const handleResetFilters = () => {
    setPage(1);
    setStatusFilter('');
    setFlaggedFilter(false);
    setSearchQuery('');
  };

  if (loading && contacts.length === 0) {
    return <div className={styles.loading}>Cargando contactos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Contactos</h1>
        <p className={styles.subtitle}>
          Total: <strong>{total}</strong> contactos
        </p>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o mensaje..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className={styles.searchInput}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={styles.select}
        >
          <option value="">Todos los estados</option>
          <option value="unread">No leído</option>
          <option value="read">Leído</option>
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={flaggedFilter}
            onChange={(e) => {
              setFlaggedFilter(e.target.checked);
              setPage(1);
            }}
          />
          Solo marcados
        </label>

        {(statusFilter || flaggedFilter || searchQuery) && (
          <button onClick={handleResetFilters} className={styles.resetBtn}>
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Tabla */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Mensaje</th>
              <th>Estado</th>
              <th>Marcado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  No hay contactos para mostrar
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className={contact.status === 'unread' ? styles.unread : ''}>
                  <td className={styles.name}>{contact.name}</td>
                  <td className={styles.email}>{contact.email}</td>
                  <td className={styles.phone}>{contact.phone || '-'}</td>
                  <td className={styles.message}>{contact.message.substring(0, 50)}...</td>
                  <td>
                    <select
                      value={contact.status}
                      onChange={(e) => handleStatusChange(contact.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="unread">No leído</option>
                      <option value="read">Leído</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => handleFlagToggle(contact.id, contact.isFlagged)}
                      className={`${styles.flagBtn} ${contact.isFlagged ? styles.flagged : ''}`}
                      title={contact.isFlagged ? 'Desmarcar' : 'Marcar'}
                    >
                      {contact.isFlagged ? '🚩' : '🏳️'}
                    </button>
                  </td>
                  <td className={styles.date}>
                    {new Date(contact.createdAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => handleOpenNotes(contact)}
                      className={styles.actionBtn}
                      title="Ver/Editar notas"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={styles.paginationBtn}
          >
            ← Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {page} de {pages}
          </span>

          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page === pages}
            className={styles.paginationBtn}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de Notas */}
      {showModal && selectedContact && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Notas del Contacto</h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.contactInfo}>
                <p>
                  <strong>De:</strong> {selectedContact.name} ({selectedContact.email})
                </p>
                <p>
                  <strong>Mensaje:</strong> {selectedContact.message}
                </p>
              </div>

              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Agrega notas administrativas aquí..."
                className={styles.notesTextarea}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowModal(false)}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNotes}
                className={styles.saveBtn}
              >
                Guardar Notas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
