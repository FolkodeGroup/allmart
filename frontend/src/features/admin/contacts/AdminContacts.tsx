import { useState, useEffect, useCallback, useRef } from 'react';
import { contactsService } from '../../../services/contactsService';
import { Modal } from '../../../components/ui/Modal';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useNotification } from '../../../context';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useAdminContact } from '../../../context/AdminContactContext';
import { MessageSquare } from 'lucide-react';
import sectionStyles from '../shared/AdminSection.module.css';
import styles from './AdminContacts.module.css';
import { Search } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: string;
  isFlagged: boolean;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = '' | 'unread' | 'read';

const LIMIT = 20;

export function AdminContacts() {
  const { showNotification } = useNotification();
  const { can } = useAdminAuth();
  const { refreshUnreadCount } = useAdminContact();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0)
  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail / notes modal
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Delete confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Track in-flight status toggle per row
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await contactsService.listContacts(
        page,
        LIMIT,
        statusFilter || undefined,
        undefined,
        debouncedSearch || undefined,
      );
      setContacts(result.data);
      setTotal(result.pagination.total as number);
      setTotalPages(result.pagination.pages as number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar consultas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleToggleReadStatus = async (contact: Contact) => {
    const newStatus = contact.status === 'unread' ? 'read' : 'unread';
    setTogglingIds(prev => new Set(prev).add(contact.id));
    // Optimistic update
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: newStatus } : c));
    try {
      await contactsService.updateContact(contact.id, { status: newStatus });
      showNotification('success', newStatus === 'read' ? 'Marcado como leído' : 'Marcado como no leído');
      refreshUnreadCount();
    } catch (err: unknown) {
      // Revert optimistic update
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: contact.status } : c));
      showNotification('error', err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(contact.id); return next; });
    }

  };

  const handleOpenDetail = (contact: Contact) => {
    setDetailContact(contact);
    setNotesText(contact.adminNotes ?? '');
    // Auto-mark as read when opening detail
    if (contact.status === 'unread') {
      handleToggleReadStatus(contact);
    }
  };

  const handleSaveNotes = async () => {
    if (!detailContact) return;
    setSavingNotes(true);
    try {
      await contactsService.updateContact(detailContact.id, { adminNotes: notesText });
      setContacts(prev => prev.map(c => c.id === detailContact.id ? { ...c, adminNotes: notesText } : c));
      showNotification('success', 'Notas guardadas');
      setDetailContact(prev => prev ? { ...prev, adminNotes: notesText } : null);
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Error al guardar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await contactsService.deleteContact(deleteConfirmId);
      showNotification('success', 'Consulta eliminada');
      setDeleteConfirmId(null);
      refreshUnreadCount();
      loadContacts();
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const unreadTotal = contacts.filter(c => c.status === 'unread').length;

  return (
    <div className={`${sectionStyles.page} ${styles.container}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            Consultas recibidas
            {unreadTotal > 0 && (
              <span className={styles.unreadBadge}>{unreadTotal}</span>
            )}
          </h1>
          <p className={styles.subtitle}>
            Mensajes enviados desde el formulario de Contacto del sitio
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{total}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>No leídas</span>
          <span className={`${styles.statValue} ${unreadTotal > 0 ? styles.danger : ''}`}>
            {unreadTotal}
          </span>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className={styles.filtersBar}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="search"
          placeholder="Buscar por nombre, email o mensaje..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Buscar consultas"
          autoComplete="off"
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
          className={styles.filterSelect}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="unread">No leídas</option>
          <option value="read">Leídas</option>
        </select>
        {(statusFilter || debouncedSearch) && (
          <button
            type="button"
            className={styles.btnRead}
            onClick={() => { setStatusFilter(''); setSearchQuery(''); setPage(1); }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner message="Cargando consultas..." size="lg" />
      ) : error ? (
        <EmptyState
          icon={<MessageSquare size={48} color="#ef4444" />}
          title="Error al cargar consultas"
          description={error}
          action={{ label: 'Reintentar', onClick: loadContacts }}
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={48} color="#94a3b8" />}
          title="No hay consultas"
          description={
            debouncedSearch || statusFilter
              ? 'No hay resultados para los filtros seleccionados.'
              : 'Todavía no se han recibido consultas desde el formulario de contacto.'
          }
        />
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Remitente</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => (
                  <tr
                    key={contact.id}
                    className={contact.status === 'unread' ? styles.unread : ''}
                  >
                    {/* Remitente */}
                    <td>
                      <div className={styles.cellContact}>
                        <span className={styles.contactName}>{contact.name}</span>
                        <a
                          href={`mailto:${contact.email}`}
                          className={styles.contactEmail}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {contact.email}
                        </a>
                        {contact.phone && (
                          <span className={styles.contactPhone}>{contact.phone}</span>
                        )}
                      </div>
                    </td>

                    {/* Mensaje (truncado, expandible) */}
                    <td className={styles.messageCellWrapper}>
                      <button
                        type="button"
                        className={styles.messageText}
                        onClick={() => handleOpenDetail(contact)}
                        title="Ver mensaje completo"
                      >
                        {contact.message.length > 100
                          ? `${contact.message.slice(0, 100)}…`
                          : contact.message}
                      </button>
                    </td>

                    {/* Estado */}
                    <td>
                      <span className={`${styles.statusBadge} ${contact.status === 'unread' ? styles.unreadBadgeStatus : styles.readBadge}`}>
                        {contact.status === 'unread' ? '● No leída' : '✓ Leída'}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className={styles.dateCell}>
                      {formatDate(contact.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.btnRead}
                          onClick={() => handleOpenDetail(contact)}
                          title="Ver detalle y notas"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          className={contact.status === 'unread' ? styles.btnRead : styles.btnUnread}
                          onClick={() => handleToggleReadStatus(contact)}
                          disabled={togglingIds.has(contact.id)}
                          title={contact.status === 'unread' ? 'Marcar como leída' : 'Marcar como no leída'}
                        >
                          {togglingIds.has(contact.id)
                            ? '...'
                            : contact.status === 'unread'
                              ? 'Marcar leída'
                              : 'No leída'}
                        </button>
                        {can('contacts.delete') && (
                          <button
                            type="button"
                            className={styles.btnDelete}
                            onClick={() => setDeleteConfirmId(contact.id)}
                            title="Eliminar consulta"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...'
                    ? <span key={`ellipsis-${idx}`} className={styles.pageInfo}>…</span>
                    : (
                      <button
                        key={item}
                        type="button"
                        className={`${styles.pageBtn} ${page === item ? styles.active : ''}`}
                        onClick={() => setPage(item as number)}
                      >
                        {item}
                      </button>
                    )
                )}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail / Notes Modal ────────────────────────────────── */}
      <Modal
        open={!!detailContact}
        onClose={() => !savingNotes && setDetailContact(null)}
        title="Detalle de la consulta"
        size="md"
        showCloseButton
        className={styles.modalPanel}
        overlayClassName={styles.modalOverlay}
        bodyClassName={styles.modalBody}
        actionsClassName={styles.modalActions}
        actions={
          <>
            <button
              type="button"
              className={styles.modalPrimaryButton}
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? 'Guardando...' : 'Guardar notas'}
            </button>
            <button
              type="button"
              className={styles.modalSecondaryButton}
              onClick={() => setDetailContact(null)}
              disabled={savingNotes}
            >
              Cerrar
            </button>
          </>
        }
        disableClose={savingNotes}
      >
        {detailContact && (
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Nombre</span>
              <span className={styles.detailValue}>{detailContact.name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <a href={`mailto:${detailContact.email}`} className={`${styles.detailValue} ${styles.detailLink}`}>
                {detailContact.email}
              </a>
            </div>
            {detailContact.phone && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Teléfono</span>
                <span className={styles.detailValue}>{detailContact.phone}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fecha</span>
              <span className={styles.detailValue}>{formatDate(detailContact.createdAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estado</span>
              <span className={`${styles.statusBadge} ${detailContact.status === 'unread' ? styles.unreadBadgeStatusmodal : styles.readBadgemodal}`}>
                {detailContact.status === 'unread' ? '● No leída' : '✓ Leída'}
              </span>
            </div>
            <div>
              <span className={styles.detailLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Mensaje</span>
              <p className={styles.detailMessage}>{detailContact.message}</p>
            </div>
            <div>
              <label className={styles.detailLabel} htmlFor="admin-notes" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Notas internas (solo visible para admins)
              </label>
              <textarea
                id="admin-notes"
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                rows={3}
                disabled={savingNotes}
                placeholder="Agregar notas internas sobre esta consulta..."
                className={styles.notesTextarea}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────── */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="Eliminar consulta"
        showCloseButton
        className={styles.modalPanel}
        overlayClassName={styles.modalOverlay}
        bodyClassName={styles.modalBody}
        actionsClassName={styles.modalActions}
        actions={
          <>
            <button
              type="button"
              className={styles.modalDangerButton}
              onClick={handleDeleteConfirmed}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
            <button
              type="button"
              className={styles.modalSecondaryButton}
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleting}
            >
              Cancelar
            </button>
          </>
        }
        disableClose={deleting}
      >
        <p className={styles.modalContentText}>¿Estás seguro de que querés eliminar esta consulta? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}
