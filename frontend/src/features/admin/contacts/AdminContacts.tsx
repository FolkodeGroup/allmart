import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown';

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

function useIsMobile(breakpoint = 520) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

function useDragToClose(
  handleRef: React.RefObject<HTMLDivElement | null>,
  isMobile: boolean,
  enabled: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !isMobile || !enabled) return;

    const panel = handle.closest('[role="dialog"]') as HTMLElement | null;
    if (!panel) return;

    const THRESHOLD = 120;
    const VELOCITY_THRESHOLD = 0.6;
    const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
    const DURATION = 280;

    let dragging = false;
    let dismissed = false;
    let startY = 0;
    let startTime = 0;
    let currentY = 0;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      startY = e.clientY;
      startTime = performance.now();
      currentY = 0;
      panel.style.transition = 'none';
      handle.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      currentY = Math.max(0, e.clientY - startY);
      panel.style.transform = `translateY(${currentY}px)`;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      const elapsed = performance.now() - startTime;
      const velocity = currentY / Math.max(elapsed, 1);

      panel.style.transition = `transform ${DURATION}ms ${EASE}`;

      if (currentY > THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        dismissed = true;
        panel.style.transform = 'translateY(100%)';
        window.setTimeout(onDismiss, DURATION - 40);
      } else {
        panel.style.transform = 'translateY(0)';
      }
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);

    return () => {
      handle.removeEventListener('pointerdown', onPointerDown);
      handle.removeEventListener('pointermove', onPointerMove);
      handle.removeEventListener('pointerup', onPointerUp);
      handle.removeEventListener('pointercancel', onPointerUp);
      if (!dismissed) {
        panel.style.transform = '';
        panel.style.transition = '';
      }
    };
  }, [handleRef, isMobile, enabled, onDismiss]);
}

export function AdminContacts() {
  const { showNotification } = useNotification();
  const { can } = useAdminAuth();
  const { refreshUnreadCount } = useAdminContact();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const isMobile = useIsMobile();

  const detailDragHandleRef = useRef<HTMLDivElement>(null);
  const deleteDragHandleRef = useRef<HTMLDivElement>(null);

  useDragToClose(
    detailDragHandleRef,
    isMobile,
    !!detailContact && !savingNotes,
    () => setDetailContact(null),
  );

  useDragToClose(
    deleteDragHandleRef,
    isMobile,
    !!deleteConfirmId && !deleting,
    () => setDeleteConfirmId(null),
  );

  const statusOptions = useMemo(() => [
    { value: '', label: 'Todos los estados' },
    { value: 'unread', label: 'No leídas' },
    { value: 'read', label: 'Leídas' }
  ], []);

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
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: newStatus } : c));
    try {
      await contactsService.updateContact(contact.id, { status: newStatus });
      showNotification('success', newStatus === 'read' ? 'Marcado como leído' : 'Marcado como no leído');
      refreshUnreadCount();
    } catch (err: unknown) {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: contact.status } : c));
      showNotification('error', err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(contact.id); return next; });
    }
  };

  const handleOpenDetail = (contact: Contact) => {
    setDetailContact(contact);
    setNotesText(contact.adminNotes ?? '');
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
        <label htmlFor="search-input" className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            id="search-input"
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
        </label>

        <div style={{ width: '180px', display: 'inline-block' }}>
          <Dropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val as StatusFilter); setPage(1); }}
            placeholder="Todos los estados"
          />
        </div>

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

                    <td>
                      <span className={`${styles.statusBadge} ${contact.status === 'unread' ? styles.unreadBadgeStatus : styles.readBadge}`}>
                        {contact.status === 'unread' ? '● No leída' : '✓ Leída'}
                      </span>
                    </td>

                    <td className={styles.dateCell}>
                      {formatDate(contact.createdAt)}
                    </td>

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
                        className={`${styles.pageBtn} ${page === item ? styles.pageActive : ''}`}
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
        {isMobile && <div ref={detailDragHandleRef} className={styles.dragHandle} aria-hidden="true" />}
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